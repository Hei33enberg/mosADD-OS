// =============================================================================
// channel0 content script (v0.2): draggable bubble + side-panel open via SW.
// =============================================================================

import { normalizeDomain } from "../lib/domain";
import { getSettings, patchSettings, type Settings } from "../lib/settings";
import { mountChat, type MountHandle } from "../shared/chat-shell";
import { CHAT_CSS } from "../shared/chat-styles";
import { t } from "../lib/i18n";

// Listen for the deep-link page (mosadd.dev/c/<domain>) ping so the landing
// page can detect that the extension is installed and show "Open" instead of
// "Install". (LINEAR-2700 / C1-5).
window.addEventListener("message", (e: MessageEvent) => {
  if (e.source !== window) return;
  if (!e.data || typeof e.data !== "object") return;
  // Only the mURL landing page may probe for the extension — refusing other
  // origins avoids being a generic "is mURL installed?" fingerprinting bit.
  if (e.origin !== "https://mosadd.dev") return;
  if (e.data.kind === "mosadd-channel0:ping") {
    try { window.postMessage({ kind: "mosadd-channel0:pong", v: "0.11" }, "https://mosadd.dev"); } catch { /* */ }
  }
});

const norm = normalizeDomain(location.href);
if (norm) void ageGateAndBootstrap(norm);

const AGE_KEY = "channel0.over16Confirmed";

async function ageGateAndBootstrap(norm: { domain: string; slug: string }): Promise<void> {
  // C1-6: one-time age gate. Stored per-install. The settings overlay surfaces
  // a "reset age confirmation" link for users who change browsers.
  try {
    const got = await chrome.storage.local.get(AGE_KEY);
    if (got?.[AGE_KEY] === true) { void bootstrap(norm); return; }
    if (got?.[AGE_KEY] === false) return; // hard-decline: user said under-16
  } catch { /* storage flaky, default open */ void bootstrap(norm); return; }
  // Inline mini-prompt (top-right toast) without mounting the full panel.
  // Built with DOM APIs (not innerHTML) so we never inject markup into the host
  // page — defensive against CSP/XSS-sink lint and trusted-types pages.
  const prompt = document.createElement("div");
  prompt.setAttribute("data-mosadd-c0-age", "");
  prompt.style.cssText = "all: initial; position: fixed; right: 16px; top: 16px; z-index: 2147483647; max-width: 320px; background: #0a0a0a; color: #fff; border: 1px solid #00ff7a; padding: 12px 14px; font-family: ui-monospace, monospace; font-size: 12px; line-height: 1.4; box-shadow: 0 8px 24px rgba(0,0,0,.5);";

  const heading = document.createElement("div");
  heading.style.cssText = "font-weight:700; color:#00ff7a; margin-bottom:6px;";
  heading.textContent = "mURL · by mosadd";

  const body = document.createElement("div");
  body.style.cssText = "margin-bottom:8px;";
  body.textContent = "Anonymous live chat overlaid on this domain. Adult-only conversations may appear. Please confirm you are 16+.";

  const btnRow = document.createElement("div");
  btnRow.style.cssText = "display:flex; gap:6px;";

  const yesBtn = document.createElement("button");
  yesBtn.setAttribute("data-yes", "");
  yesBtn.style.cssText = "flex:1; background:#00ff7a; color:#000; border:0; padding:6px 8px; font-weight:700; cursor:pointer; font-family:inherit; font-size:11px; text-transform:uppercase; letter-spacing:0.08em;";
  yesBtn.textContent = "I am 16+";

  const noBtn = document.createElement("button");
  noBtn.setAttribute("data-no", "");
  noBtn.style.cssText = "flex:1; background:transparent; color:#fff; border:1px solid rgba(255,255,255,0.3); padding:6px 8px; font-weight:700; cursor:pointer; font-family:inherit; font-size:11px; text-transform:uppercase; letter-spacing:0.08em;";
  noBtn.textContent = "I am not";

  btnRow.appendChild(yesBtn);
  btnRow.appendChild(noBtn);
  prompt.appendChild(heading);
  prompt.appendChild(body);
  prompt.appendChild(btnRow);

  if (document.body) document.body.appendChild(prompt);
  else document.addEventListener("DOMContentLoaded", () => document.body?.appendChild(prompt));
  prompt.querySelector("[data-yes]")?.addEventListener("click", async () => {
    try { await chrome.storage.local.set({ [AGE_KEY]: true }); } catch { /* */ }
    prompt.remove();
    void bootstrap(norm);
  });
  prompt.querySelector("[data-no]")?.addEventListener("click", async () => {
    try { await chrome.storage.local.set({ [AGE_KEY]: false }); } catch { /* */ }
    prompt.remove();
  });
}

async function bootstrap(norm: { domain: string; slug: string }): Promise<void> {
  const settings = await getSettings();

  const host = document.createElement("div");
  host.setAttribute("data-mosadd-channel0", "");
  host.style.cssText = "all: initial; position: fixed; inset: 0; pointer-events: none; z-index: 2147483647;";
  const shadow = host.attachShadow({ mode: "closed" });
  shadow.appendChild(buildStyles());

  if (document.body) document.body.appendChild(host);
  else document.addEventListener("DOMContentLoaded", () => document.body?.appendChild(host));

  const bubble = renderBubble(shadow, settings);
  let inlinePanel: { handle: MountHandle; el: HTMLElement } | null = null;

  bubble.onClick = async () => {
    const s = await getSettings();
    if (s.openMode === "side") {
      const ok = await tryOpenSidePanel();
      if (!ok) toggleInline();
    } else {
      toggleInline();
    }
  };

  function toggleInline(): void {
    if (inlinePanel) { inlinePanel.handle.destroy(); inlinePanel.el.remove(); inlinePanel = null; return; }
    const el = document.createElement("div");
    el.className = "c0-inline";
    shadow.appendChild(el);
    const handle = mountChat(el, {
      domain: norm.domain,
      actions: [{ icon: "close", i18nKey: "tooltipClose", onClick: () => { if (inlinePanel) { inlinePanel.handle.destroy(); inlinePanel.el.remove(); inlinePanel = null; } } }],
      onPresence(c) { bubble.setCount(c); },
    });
    inlinePanel = { handle, el };
  }
}

interface BubbleHandle {
  setCount(c: number): void;
  onClick: () => void;
}

function renderBubble(shadow: ShadowRoot, settings: Settings): BubbleHandle {
  const wrap = document.createElement("div");
  wrap.className = "c0-bubble-wrap";
  applyBubblePos(wrap, settings.bubbleVisible ? settings.bubble : null);
  shadow.appendChild(wrap);

  const btn = document.createElement("button");
  btn.className = "c0-bubble";
  btn.title = t("actionTitle");
  btn.innerHTML = `<span class="c0-bubble-dot"></span><span class="c0-bubble-count" data-count>0</span>`;
  wrap.appendChild(btn);

  const handle: BubbleHandle = {
    setCount(c: number) {
      const el = btn.querySelector("[data-count]") as HTMLSpanElement;
      el.textContent = String(Math.max(0, c - 1));
      btn.classList.toggle("has-people", c > 1);
    },
    onClick: () => { /* set by caller */ },
  };

  let dragStart: { x: number; y: number; ox: number; oy: number } | null = null;
  let moved = false;

  btn.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const r = wrap.getBoundingClientRect();
    dragStart = { x: e.clientX, y: e.clientY, ox: r.left, oy: r.top };
    moved = false;
    btn.setPointerCapture(e.pointerId);
  });

  btn.addEventListener("pointermove", (e) => {
    if (!dragStart) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (!moved && Math.hypot(dx, dy) < 5) return;
    moved = true;
    wrap.style.left = `${dragStart.ox + dx}px`;
    wrap.style.top  = `${dragStart.oy + dy}px`;
    wrap.style.right = "auto"; wrap.style.bottom = "auto";
  });

  btn.addEventListener("pointerup", async (e) => {
    if (!dragStart) return;
    const wasDrag = moved;
    dragStart = null;
    btn.releasePointerCapture(e.pointerId);
    if (wasDrag) {
      const r = wrap.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const W = window.innerWidth, H = window.innerHeight;
      const anchor: Settings["bubble"]["anchor"] =
        cy > H / 2 ? (cx > W / 2 ? "br" : "bl") : (cx > W / 2 ? "tr" : "tl");
      const margin = 16;
      const x = anchor.endsWith("r") ? Math.max(margin, W - r.right) : Math.max(margin, r.left);
      const y = anchor.startsWith("b") ? Math.max(margin, H - r.bottom) : Math.max(margin, r.top);
      const next = await patchSettings({ bubble: { anchor, x, y } });
      applyBubblePos(wrap, next.bubble);
    } else {
      handle.onClick();
    }
  });

  return handle;
}

function applyBubblePos(wrap: HTMLElement, pos: Settings["bubble"] | null): void {
  wrap.style.left = "auto"; wrap.style.right = "auto"; wrap.style.top = "auto"; wrap.style.bottom = "auto";
  if (!pos) { wrap.style.display = "none"; return; }
  wrap.style.display = "block";
  if (pos.anchor.endsWith("r")) wrap.style.right = `${pos.x}px`; else wrap.style.left = `${pos.x}px`;
  if (pos.anchor.startsWith("b")) wrap.style.bottom = `${pos.y}px`; else wrap.style.top = `${pos.y}px`;
}

async function tryOpenSidePanel(): Promise<boolean> {
  try {
    const resp = await chrome.runtime.sendMessage({ type: "channel0:open-side-panel" });
    return !!resp?.ok;
  } catch { return false; }
}

function buildStyles(): HTMLStyleElement {
  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    .c0-bubble-wrap { position: fixed; pointer-events: auto; z-index: 2147483646; }
    .c0-bubble {
      width: 56px; height: 56px; border-radius: 28px;
      background: #0a0a0a; color: #00ff7a; border: 1px solid #1a1a1a;
      box-shadow: 0 8px 24px rgba(0,0,0,.35);
      cursor: grab; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 16px; letter-spacing: .5px; user-select: none;
      touch-action: none;
    }
    .c0-bubble:hover { background: #111; }
    .c0-bubble:active { cursor: grabbing; }
    .c0-bubble-dot { width: 8px; height: 8px; border-radius: 4px; background: #00ff7a; margin-right: 6px; box-shadow: 0 0 8px #00ff7a; }
    .c0-bubble.has-people { box-shadow: 0 0 0 2px #00ff7a inset, 0 8px 24px rgba(0,0,0,.35); }
    .c0-inline {
      position: fixed; right: 16px; bottom: 84px; pointer-events: auto;
      width: 360px; max-height: 520px; height: 70vh;
      border: 1px solid #1a1a1a; border-radius: 12px; overflow: hidden;
      box-shadow: 0 16px 48px rgba(0,0,0,.5);
      z-index: 2147483647;
      display: flex;
    }
    .c0-inline > * { flex: 1; }
    ${CHAT_CSS}
  `;
  return style;
}
