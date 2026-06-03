// =============================================================================
// chat-shell.ts — the chat UI that BOTH the content-script floating panel AND
// the side panel mount. Single source of truth so the two surfaces never drift.
// =============================================================================

import { deterministicIdentity } from "../lib/nick";
import { getDeviceToken, getNickFor } from "../lib/identity-store";
import {
  joinDomain,
  openChannelSocket,
  sendChat,
  type ChatMessage,
  type JoinResult,
} from "../lib/client";
import { t } from "../lib/i18n";

export interface MountOptions {
  domain: string;
  withClose?: boolean;
  onClose?: () => void;
  onPresence?: (count: number) => void;
}

export interface MountHandle { destroy(): void; }

export function mountChat(container: HTMLElement, opts: MountOptions): MountHandle {
  const { domain, withClose = false, onClose, onPresence } = opts;
  let ws: WebSocket | null = null;
  let destroyed = false;

  const root = document.createElement("div");
  root.className = "c0-chat";
  container.appendChild(root);

  root.innerHTML = `
    <div class="c0-bg"></div>
    <div class="c0-head">
      <span class="c0-title">${escapeHtml(t("channelLabel"))}</span>
      <span class="c0-domain">#${escapeHtml(domain)}</span>
      <span class="c0-count" data-count>${escapeHtml(t("connecting"))}</span>
      ${withClose ? `<button class="c0-close" aria-label="close">✕</button>` : ""}
    </div>
    <div class="c0-notice"></div>
    <div class="c0-feed" data-feed></div>
    <form class="c0-compose" data-compose>
      <input type="text" maxlength="2000" autocomplete="off" />
      <button type="submit" disabled>${escapeHtml(t("send"))}</button>
    </form>
    <div class="c0-footer">
      <span data-youare></span>
      <span class="c0-brand">${escapeHtml(t("poweredBy"))}</span>
    </div>
  `;

  const feed   = root.querySelector("[data-feed]")   as HTMLDivElement;
  const count  = root.querySelector("[data-count]")  as HTMLSpanElement;
  const form   = root.querySelector("[data-compose]") as HTMLFormElement;
  const input  = form.querySelector("input")  as HTMLInputElement;
  const sendBtn = form.querySelector("button") as HTMLButtonElement;
  const youareEl = root.querySelector("[data-youare]") as HTMLSpanElement;
  const notice = root.querySelector(".c0-notice")    as HTMLDivElement;

  renderDisclaimer(notice, domain);

  if (withClose) {
    root.querySelector(".c0-close")?.addEventListener("click", () => {
      onClose?.();
      destroy();
    });
  }

  pushSystem(feed, t("welcome", domain));

  void (async () => {
    try {
      const deviceToken = await getDeviceToken();
      const nick = await getNickFor(domain, deviceToken);
      const me = deterministicIdentity(deviceToken, domain);

      input.placeholder = t("composePlaceholder", nick);
      youareEl.textContent = `${t("youAre")} `;
      const brand = document.createElement("span");
      brand.className = "c0-brand";
      brand.textContent = nick;
      youareEl.appendChild(brand);

      const join: JoinResult = await joinDomain({ domain, deviceToken, nick });
      if (destroyed) return;
      if (join.status === "blocked") {
        pushSystem(feed, t("errBlocked"));
        sendBtn.disabled = true;
        return;
      }

      ws = await openChannelSocket(join, {
        onOpen() {
          if (destroyed) return;
          sendBtn.disabled = false;
          count.textContent = t("connected");
        },
        onMessage(msg) {
          if (destroyed) return;
          appendMessage(feed, msg, nick, me.hue, me.initials);
        },
        onPresence(p) {
          if (destroyed) return;
          count.textContent = t("live", String(p.count));
          onPresence?.(p.count);
        },
        onClose(code) {
          if (destroyed) return;
          sendBtn.disabled = true;
          count.textContent = `${t("disconnected")} (${code})`;
        },
      });

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text || !ws) return;
        if (sendChat(ws, text, nick)) input.value = "";
      });
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "error";
      pushSystem(feed,
        code === "domain_blocked"   ? t("errBlocked") :
        code === "rate_limited"     ? t("errRateLimited") :
                                      t("errGeneric", code));
    }
  })();

  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    try { ws?.close(1000, "destroy"); } catch { /* ignore */ }
    ws = null;
    try { root.remove(); } catch { /* ignore */ }
  }

  return { destroy };
}

function renderDisclaimer(target: HTMLElement, domain: string): void {
  target.textContent = "";
  const span = document.createElement("span");
  const raw = t("disclaimer", domain, "mosadd");
  const parts = raw.split(/(mosadd)/);
  for (const p of parts) {
    if (p === "mosadd") {
      const b = document.createElement("b"); b.textContent = "mosadd"; span.appendChild(b);
    } else if (p.includes(domain)) {
      const idx = p.indexOf(domain);
      span.appendChild(document.createTextNode(p.slice(0, idx)));
      const b = document.createElement("b"); b.textContent = domain; span.appendChild(b);
      span.appendChild(document.createTextNode(p.slice(idx + domain.length)));
    } else {
      span.appendChild(document.createTextNode(p));
    }
  }
  target.appendChild(span);
}

function appendMessage(feed: HTMLElement, msg: ChatMessage, myNick: string, myHue: number, myInitials: string): void {
  const from = (msg.from ?? "anon").startsWith("anon:") ? (msg.from as string).slice(5) : (msg.from ?? "anon");
  const isMe = from === myNick;
  const hue = isMe ? myHue : Math.abs(fnvLite(from)) % 360;
  const initials = isMe ? myInitials : `${from[0] ?? "?"}${from[1] ?? from[0] ?? "?"}`.toUpperCase();
  const row = document.createElement("div");
  row.className = "c0-row";
  row.innerHTML = `
    <div class="c0-av" style="background:hsl(${hue}, 80%, 60%)">${escapeHtml(initials)}</div>
    <div class="c0-bubble">
      <div class="c0-who"><span${isMe ? ' class="c0-me"' : ""}>${escapeHtml(from)}${isMe ? " (you)" : ""}</span></div>
      <div class="c0-text"></div>
    </div>
  `;
  (row.querySelector(".c0-text") as HTMLDivElement).textContent = msg.text;
  feed.appendChild(row);
  feed.scrollTop = feed.scrollHeight;
}

function pushSystem(feed: HTMLElement, text: string): void {
  const row = document.createElement("div");
  row.className = "c0-row";
  row.innerHTML = `<div class="c0-bubble"><div class="c0-text c0-system"></div></div>`;
  (row.querySelector(".c0-text") as HTMLDivElement).textContent = text;
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
