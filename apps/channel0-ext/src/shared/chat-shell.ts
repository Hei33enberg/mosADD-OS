// Brutalist mIRC chat shell. Header (mIRC #domain + toolbar), non-affiliation
// banner, IRC-style feed, pre-join nick gate -> compose row.

import { deterministicIdentity } from "../lib/nick";
import { getDeviceToken, getNickFor, setNickFor } from "../lib/identity-store";
import { joinDomain, openChannelSocket, sendChat, type ChatMessage, type JoinResult } from "../lib/client";
import { t } from "../lib/i18n";
import { reportMessage, type ReportReason, shouldThrottleLinks, pushLinkHistory } from "../lib/moderation";

export interface ToolbarAction {
  icon: "dock-left" | "dock-right" | "settings" | "close" | "flame" | "share";
  active?: boolean;
  onClick(): void;
  i18nKey: "tooltipDockLeft" | "tooltipDockRight" | "tooltipSettings" | "tooltipClose" | "tooltipTrending" | "tooltipShare";
}

export interface MountOptions {
  domain: string;
  actions?: ToolbarAction[];
  autoJoinIfKnown?: boolean;
  onPresence?: (count: number) => void;
}

export interface MountHandle { destroy(): void; }

const NICK_SEEN_KEY = "channel0.nickConfirmed";

const ICON_SVG: Record<ToolbarAction["icon"], string> = {
  "dock-left":  "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"square\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\"/><line x1=\"9\" y1=\"3\" x2=\"9\" y2=\"21\"/></svg>",
  "dock-right": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"square\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\"/><line x1=\"15\" y1=\"3\" x2=\"15\" y2=\"21\"/></svg>",
  "settings":   "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"square\"><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg>",
  "flame":      "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z\"/></svg>",
  "share":      "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"18\" cy=\"5\" r=\"3\"/><circle cx=\"6\" cy=\"12\" r=\"3\"/><circle cx=\"18\" cy=\"19\" r=\"3\"/><line x1=\"8.59\" y1=\"13.51\" x2=\"15.42\" y2=\"17.49\"/><line x1=\"15.41\" y1=\"6.51\" x2=\"8.59\" y2=\"10.49\"/></svg>",
  "close":      "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"square\"><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/></svg>",
};

function pad(n: number): string { return n.toString().padStart(2, "0"); }

export function mountChat(container: HTMLElement, opts: MountOptions): MountHandle {
  const { domain, actions = [], autoJoinIfKnown = true, onPresence } = opts;
  let ws: WebSocket | null = null;
  let destroyed = false;
  let nick = "";

  const root = document.createElement("div");
  root.className = "c0-chat";
  container.appendChild(root);

  const bg = document.createElement("div");
  bg.className = "c0-bg";
  root.appendChild(bg);

  // Header: black bar, white bold "mIRC #domain", live count, toolbar actions.
  const head = document.createElement("div");
  head.className = "c0-head";
  const title = document.createElement("span");
  title.className = "c0-head-title";
  const mircSpan = document.createElement("span");
  mircSpan.className = "c0-mirc";
  mircSpan.textContent = t("headerMirc");
  const domainSpan = document.createElement("span");
  domainSpan.className = "c0-domain";
  domainSpan.textContent = "#" + domain;
  const liveSpan = document.createElement("span");
  liveSpan.className = "c0-head-live";
  liveSpan.style.display = "none";
  const liveDot = document.createElement("span");
  liveDot.className = "c0-dot";
  const liveCountEl = document.createElement("span");
  liveCountEl.textContent = "0";
  liveSpan.appendChild(liveDot);
  liveSpan.appendChild(liveCountEl);
  title.appendChild(mircSpan);
  title.appendChild(document.createTextNode(" "));
  title.appendChild(domainSpan);
  title.appendChild(document.createTextNode(" "));
  title.appendChild(liveSpan);
  head.appendChild(title);
  const spacer = document.createElement("span");
  spacer.className = "c0-head-spacer";
  head.appendChild(spacer);
  for (const a of actions) {
    const b = document.createElement("button");
    b.className = "c0-head-btn" + (a.active ? " is-active" : "");
    b.type = "button";
    b.title = t(a.i18nKey);
    b.setAttribute("aria-label", t(a.i18nKey));
    b.innerHTML = ICON_SVG[a.icon];
    b.addEventListener("click", a.onClick);
    head.appendChild(b);
  }
  root.appendChild(head);

  // Disclaimer.
  const notice = document.createElement("div");
  notice.className = "c0-notice";
  renderDisclaimer(notice, domain);
  root.appendChild(notice);

  // Feed.
  const feed = document.createElement("div");
  feed.className = "c0-feed";
  root.appendChild(feed);

  // Branding placeholder (filled after join returns branding payload).
  const pinSlot = document.createElement("div");
  pinSlot.className = "c0-pin";
  pinSlot.style.display = "none";
  root.insertBefore(pinSlot, feed);

  // Pre-join nick gate.
  const prejoin = document.createElement("div");
  prejoin.className = "c0-prejoin";
  const labelEl = document.createElement("label");
  labelEl.className = "c0-prejoin-label";
  labelEl.htmlFor = "c0-nick";
  labelEl.textContent = t("prejoinLabel");
  const rowEl = document.createElement("div");
  rowEl.className = "c0-prejoin-row";
  const nickInput = document.createElement("input");
  nickInput.id = "c0-nick";
  nickInput.type = "text";
  nickInput.maxLength = 32;
  nickInput.autocomplete = "off";
  nickInput.placeholder = t("prejoinPlaceholder");
  const goBtn = document.createElement("button");
  goBtn.type = "button";
  goBtn.className = "c0-prejoin-go";
  goBtn.textContent = t("prejoinGo");
  rowEl.appendChild(nickInput);
  rowEl.appendChild(goBtn);
  const altA = document.createElement("a");
  altA.className = "c0-prejoin-alt";
  altA.href = "https://mosadd.com";
  altA.target = "_blank";
  altA.rel = "noreferrer";
  altA.textContent = t("prejoinAlt");
  prejoin.appendChild(labelEl);
  prejoin.appendChild(rowEl);
  prejoin.appendChild(altA);
  root.appendChild(prejoin);

  void (async () => {
    const deviceToken = await getDeviceToken();
    const detNick = deterministicIdentity(deviceToken, domain).nick;
    try { nickInput.value = await getNickFor(domain, deviceToken); }
    catch { nickInput.value = detNick; }
    const confirmed = await wasConfirmed(domain);
    if (autoJoinIfKnown && confirmed) {
      await beginJoin(nickInput.value, deviceToken, false);
      return;
    }
    try { nickInput.focus(); nickInput.select(); } catch { /* */ }
  })();

  goBtn.addEventListener("click", async () => {
    const v = nickInput.value.trim();
    if (!v) return;
    const deviceToken = await getDeviceToken();
    await beginJoin(v, deviceToken, true);
  });
  nickInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); goBtn.click(); }
  });

  async function beginJoin(chosenNick: string, deviceToken: string, persist: boolean): Promise<void> {
    if (destroyed) return;
    nick = chosenNick.slice(0, 32);
    if (persist) {
      try { await setNickFor(domain, nick); } catch { /* */ }
      try { await chrome.storage.sync.set({ [NICK_SEEN_KEY + ":" + domain]: 1 }); } catch { /* */ }
    }
    swapPrejoinForCompose();
    await connect(deviceToken);
  }

  let composeInput: HTMLInputElement | null = null;
  let sendBtn: HTMLButtonElement | null = null;

  function swapPrejoinForCompose(): void {
    prejoin.remove();
    const compose = document.createElement("form");
    compose.className = "c0-compose";
    const ci = document.createElement("input");
    ci.type = "text";
    ci.maxLength = 2000;
    ci.autocomplete = "off";
    ci.placeholder = t("composePlaceholder", nick);
    const sb = document.createElement("button");
    sb.type = "submit";
    sb.disabled = true;
    sb.textContent = t("send");
    compose.appendChild(ci);
    compose.appendChild(sb);
    composeInput = ci;
    sendBtn = sb;
    compose.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = ci.value.trim();
      if (!text || !ws) return;
      if (sendChat(ws, text, nick)) ci.value = "";
    });
    root.appendChild(compose);
    pushSystem(feed, t("welcome", domain));
    try { ci.focus(); } catch { /* */ }
  }

  async function connect(deviceToken: string): Promise<void> {
    try {
      const join: JoinResult = await joinDomain({ domain, deviceToken, nick });
      if (destroyed) return;
      applyBranding(head, pinSlot, join.branding ?? {}, join.status);
      if (join.status === "blocked") {
        pushSystem(feed, t("errBlocked"));
        if (sendBtn) sendBtn.disabled = true;
        return;
      }
      ws = await openChannelSocket(join, {
        onOpen()  { if (!destroyed && sendBtn) sendBtn.disabled = false; },
        onMessage(msg) {
          if (destroyed) return;
          appendMessage(feed, msg, nick, async (id, reason) => {
            try {
              const dev = await getDeviceToken();
              await reportMessage({ messageId: id, channelSlug: join.channel_id, deviceToken: dev, reason });
            } catch (e) { console.warn('[channel0] report failed', e); }
          });
        },
        onPresence(p) {
          if (destroyed) return;
          liveSpan.style.display = "inline-flex";
          liveCountEl.textContent = String(p.count);
          onPresence?.(p.count);
        },
        onClose(_code) { if (!destroyed && sendBtn) sendBtn.disabled = true; },
      });
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "error";
      pushSystem(feed,
        code === "domain_blocked"   ? t("errBlocked") :
        code === "rate_limited"     ? t("errRateLimited") :
                                      t("errGeneric", code));
    }
  }

  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    try { ws?.close(1000, "destroy"); } catch { /* */ }
    ws = null;
    try { root.remove(); } catch { /* */ }
  }

  return { destroy };
}

async function wasConfirmed(domain: string): Promise<boolean> {
  try {
    const key = NICK_SEEN_KEY + ":" + domain;
    const got = await chrome.storage.sync.get(key);
    return !!got?.[key];
  } catch { return false; }
}

function renderDisclaimer(target: HTMLElement, domain: string): void {
  target.textContent = "";
  const raw = t("disclaimer", domain, "mosadd");
  const parts = raw.split(/(mosadd)/);
  for (const p of parts) {
    if (p === "mosadd") {
      const b = document.createElement("b"); b.textContent = "mosadd"; target.appendChild(b);
    } else if (p.includes(domain)) {
      const idx = p.indexOf(domain);
      target.appendChild(document.createTextNode(p.slice(0, idx)));
      const b = document.createElement("b"); b.textContent = domain; target.appendChild(b);
      target.appendChild(document.createTextNode(p.slice(idx + domain.length)));
    } else {
      target.appendChild(document.createTextNode(p));
    }
  }
}

function appendMessage(feed: HTMLElement, msg: ChatMessage, myNick: string, onReport?: (id: string, reason: ReportReason) => void): void {
  const fromRaw = msg.from ?? "anon";
  const from = fromRaw.startsWith("anon:") ? fromRaw.slice(5) : fromRaw;
  const isMe = from === myNick;
  const ts = new Date(msg.ts);
  const time = pad(ts.getHours()) + ":" + pad(ts.getMinutes());
  const row = document.createElement("div");
  row.className = "c0-row";
  const tSpan = document.createElement("span");
  tSpan.className = "c0-time";
  tSpan.textContent = "[" + time + "]";
  const nSpan = document.createElement("span");
  nSpan.className = "c0-nick" + (isMe ? " is-me" : "");
  nSpan.textContent = "<" + from + ">";
  const xSpan = document.createElement("span");
  xSpan.className = "c0-text";
  xSpan.textContent = msg.text;
  row.appendChild(tSpan); row.appendChild(nSpan); row.appendChild(xSpan);
  if (onReport && !isMe) {
    const rep = document.createElement("button");
    rep.type = "button";
    rep.className = "c0-rep";
    rep.title = "Report";
    rep.setAttribute("aria-label", "Report this message");
    rep.textContent = "!";
    rep.addEventListener("click", (e) => {
      e.stopPropagation();
      const reason = window.prompt("Report this message — type: spam / abuse / illegal / other", "spam");
      if (!reason) return;
      const r = reason.trim().toLowerCase();
      const allowed = ["spam", "abuse", "illegal", "other"];
      if (!allowed.includes(r)) { alert("Use one of: spam, abuse, illegal, other."); return; }
      onReport(msg.id, r as ReportReason);
      rep.disabled = true;
      rep.textContent = "✓";
    });
    row.appendChild(rep);
  }
  feed.appendChild(row);
  feed.scrollTop = feed.scrollHeight;
}

function pushSystem(feed: HTMLElement, text: string): void {
  const row = document.createElement("div");
  row.className = "c0-row c0-system";
  const tSpan = document.createElement("span"); tSpan.className = "c0-time";
  const nSpan = document.createElement("span"); nSpan.className = "c0-nick"; nSpan.textContent = "*";
  const xSpan = document.createElement("span"); xSpan.className = "c0-text"; xSpan.textContent = text;
  row.appendChild(tSpan); row.appendChild(nSpan); row.appendChild(xSpan);
  feed.appendChild(row);
  feed.scrollTop = feed.scrollHeight;
}


function applyBranding(head: HTMLElement, pinSlot: HTMLElement, branding: Record<string, unknown>, status?: string): void {
  const accent = typeof branding.accent_color === "string" ? branding.accent_color : null;
  if (accent && /^#[0-9a-f]{6}$/i.test(accent)) {
    head.style.borderBottomColor = accent;
    head.style.boxShadow = "0 1px 0 0 " + accent + " inset";
  }
  if (status === "claimed" && branding.official_badge) {
    const badge = document.createElement("span");
    badge.className = "c0-badge";
    badge.textContent = "OFFICIAL";
    badge.title = typeof branding.owner_name === "string" && branding.owner_name
      ? "Claimed by " + branding.owner_name
      : "Claimed by verified domain owner";
    head.querySelector(".c0-head-title")?.appendChild(badge);
  }
  const pinned = typeof branding.pinned_message === "string" ? branding.pinned_message.slice(0, 280) : "";
  if (pinned) {
    pinSlot.textContent = "";
    const pin = document.createElement("div");
    pin.className = "c0-pin-body";
    pin.textContent = "📌 " + pinned;
    pinSlot.appendChild(pin);
    pinSlot.style.display = "block";
  }
}
