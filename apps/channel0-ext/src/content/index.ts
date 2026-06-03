// =============================================================================
// channel0 content script (LINEAR-2689, 2694).
//
// Mounts a fixed-position toggle button + chat panel into every page, isolated
// inside a closed shadow root so the host site's CSS can't break us (and our
// styles can't break the host page). On open:
//   1. Normalize document.location → eTLD+1 + slug.
//   2. POST channel0-join → channel-scoped JWT.
//   3. Open WebSocket to the Cloudflare Worker.
//   4. Render messages + presence + send.
//
// Legal/safety must-haves baked in (C1-6 lands the full version):
//   - Disclaimer banner: "Niezależny czat — niezwiązany z {domain}.
//     Powered by mosadd." This is the non-affiliation mark the plan demands.
//   - "Powered by mosadd" badge in the footer is the brand-energizer.
//   - Reload-on-block (HTTP 451) so a verified owner's disable propagates.
//
// We don't mount on file://, chrome://, about://, or pages where the
// normalizer can't produce a registrable domain (IP, localhost, intranet).
// =============================================================================

import { normalizeDomain } from "../lib/domain";
import { deterministicIdentity } from "../lib/nick";
import { getDeviceToken, getNickFor } from "../lib/identity-store";
import { joinDomain, openChannelSocket, sendChat, type ChatMessage, type JoinResult } from "../lib/client";
import { PANEL_CSS } from "./styles";

const norm = normalizeDomain(location.href);
if (norm) bootstrap(norm);

function bootstrap(norm: { domain: string; slug: string }): void {
  // Host element lives at the very top of <body> so even sites with z-index
  // wars (we see you, every checkout flow) can't bury it. Pointer-events on
  // host stay default — only the children get clicks.
  const host = document.createElement("div");
  host.setAttribute("data-mosadd-channel0", "");
  host.style.cssText = "all: initial; position: relative; z-index: 2147483647;";
  const shadow = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = PANEL_CSS;
  shadow.appendChild(style);

  const root = document.createElement("div");
  shadow.appendChild(root);

  // Wait for body — content scripts can run before parsing finishes on some
  // sites despite document_idle.
  if (document.body) document.body.appendChild(host);
  else document.addEventListener("DOMContentLoaded", () => document.body?.appendChild(host));

  renderToggle(root, norm);
}

function renderToggle(root: ShadowRoot | HTMLElement, norm: { domain: string; slug: string }): void {
  const toggle = document.createElement("button");
  toggle.className = "toggle";
  toggle.title = `channel 0 — chat with everyone on ${norm.domain}`;
  toggle.innerHTML = `<span class="dot"></span>0`;
  toggle.addEventListener("click", () => openPanel(root, norm, toggle));
  root.appendChild(toggle);
}

interface ChannelState { join: JoinResult; ws: WebSocket; messages: ChatMessage[]; roster: string[]; nick: string }

async function openPanel(root: ShadowRoot | HTMLElement, norm: { domain: string; slug: string }, toggle: HTMLButtonElement): Promise<void> {
  // Re-entrant: if a panel is already mounted, just bring it to front.
  const existing = root.querySelector?.(".panel") as HTMLElement | null;
  if (existing) { existing.scrollIntoView?.(); return; }

  const deviceToken = await getDeviceToken();
  const nick = await getNickFor(norm.domain, deviceToken);
  const me = deterministicIdentity(deviceToken, norm.domain);

  // Build the panel skeleton first so the user sees the room loading.
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="head">
      <span class="title">channel 0</span>
      <span class="domain">#${norm.domain}</span>
      <span class="count" data-count>· connecting…</span>
      <button class="close" aria-label="close">✕</button>
    </div>
    <div class="notice">
      Niezależny czat — <b>niezwiązany z ${escapeHtml(norm.domain)}</b>. Rozmawiasz z osobami,
      które są teraz na tej domenie. Powered by <b>mosadd</b>.
    </div>
    <div class="feed" data-feed></div>
    <form class="compose" data-compose>
      <input type="text" placeholder="Powiedz coś jako ${escapeHtml(nick)}…" maxlength="2000" autocomplete="off" />
      <button type="submit" disabled>send</button>
    </form>
    <div class="footer">
      <span>you are <span class="brand">${escapeHtml(nick)}</span></span>
      <span class="brand">powered by mosadd</span>
    </div>
  `;
  root.appendChild(panel);

  const feed = panel.querySelector("[data-feed]") as HTMLDivElement;
  const countEl = panel.querySelector("[data-count]") as HTMLSpanElement;
  const form = panel.querySelector("[data-compose]") as HTMLFormElement;
  const input = form.querySelector("input") as HTMLInputElement;
  const sendBtn = form.querySelector("button") as HTMLButtonElement;
  const closeBtn = panel.querySelector(".close") as HTMLButtonElement;

  pushSystem(feed, `welcome to #${norm.domain} — say hi 👋`);

  closeBtn.addEventListener("click", () => panel.remove());

  let state: ChannelState | null = null;

  try {
    const join = await joinDomain({ domain: norm.domain, deviceToken, nick });
    if (join.status === "blocked") {
      pushSystem(feed, "this channel is disabled by the domain owner.");
      sendBtn.disabled = true;
      return;
    }
    const ws = await openChannelSocket(join, {
      onOpen() {
        sendBtn.disabled = false;
        countEl.textContent = "· connected";
      },
      onMessage(msg) {
        if (state) state.messages.push(msg);
        appendMessage(feed, msg, nick, me.hue, me.initials);
      },
      onPresence(p) {
        if (state) state.roster = p.roster;
        countEl.textContent = `· ${p.count} live`;
        toggle.classList.toggle("has-people", p.count > 1);
        toggle.firstElementChild?.nextSibling?.replaceWith(String(Math.max(0, p.count - 1)));
      },
      onClose(code) {
        sendBtn.disabled = true;
        countEl.textContent = `· disconnected (${code})`;
      },
    });
    state = { join, ws, messages: [], roster: [], nick };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || !state) return;
      if (sendChat(state.ws, text, state.nick)) input.value = "";
    });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "error";
    pushSystem(feed, code === "domain_blocked"
      ? "this channel is disabled by the domain owner."
      : code === "rate_limited"
      ? "slowing you down — try again in a moment."
      : `couldn't connect (${code}). try again in a sec.`);
  }
}

function appendMessage(feed: HTMLElement, msg: ChatMessage, myNick: string, myHue: number, myInitials: string): void {
  const from = (msg.from ?? "anon").startsWith("anon:") ? (msg.from as string).slice(5) : (msg.from ?? "anon");
  const isMe = from === myNick;
  const hue = isMe ? myHue : Math.abs(fnvLite(from)) % 360;
  const initials = isMe ? myInitials : `${from[0] ?? "?"}${from[1] ?? from[0] ?? "?"}`.toUpperCase();
  const row = document.createElement("div");
  row.className = "row";
  row.innerHTML = `
    <div class="av" style="background:hsl(${hue}, 80%, 60%)">${escapeHtml(initials)}</div>
    <div class="bubble">
      <div class="who"><span${isMe ? ' class="me"' : ""}>${escapeHtml(from)}${isMe ? " (you)" : ""}</span></div>
      <div class="text"></div>
    </div>
  `;
  (row.querySelector(".text") as HTMLDivElement).textContent = msg.text;
  feed.appendChild(row);
  feed.scrollTop = feed.scrollHeight;
}

function pushSystem(feed: HTMLElement, text: string): void {
  const row = document.createElement("div");
  row.className = "row";
  row.innerHTML = `<div class="bubble"><div class="text system"></div></div>`;
  (row.querySelector(".text") as HTMLDivElement).textContent = text;
  feed.appendChild(row);
  feed.scrollTop = feed.scrollHeight;
}

function fnvLite(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return h;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c] as string));
}
