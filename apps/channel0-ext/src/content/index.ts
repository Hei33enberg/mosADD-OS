// =============================================================================
// mURL content script — docked, resizable in-page side panel (strajkpolski-style).
// The ONLY surface: a draggable launcher bubble opens a full-height panel docked
// left/right, resizable by a grip, with a dock-left/right toggle in the header.
// No floating box, no native Edge side panel.
// =============================================================================

import { normalizeDomain } from "../lib/domain";
import { getSettings, onSettingsChange, patchSettings, type Settings } from "../lib/settings";
import { mountChat, type MountHandle, type ToolbarAction } from "../shared/chat-shell";
import { CHAT_CSS } from "../shared/chat-styles";
import { t } from "../lib/i18n";
import { applySkinToShadow, setShadowSkin, normalizeSkinId } from "../skins/runtime/extension";
import { SKINS } from "../skins/registry";
import { SKIN_SYNC_EVENT } from "../skins/contract";
import { extractBrandAccent, brandAccentCss } from "./auto-skin";
import { getBrand, setBrand } from "../lib/brand-store";

// BM-1: accent-only brand match. Keep the mosadd-dark shell and overlay ONLY the
// host site's brand color onto our accent tokens, cached per-domain.
const AUTO_ID = "auto";                 // legacy full-match skin id — retired, mapped to the dark shell
const BRAND_STYLE_ID = "m-skin-brand";
const BRAND_ATTR = "data-murl-brand";
const BRAND_TTL_MS = 1000 * 60 * 60 * 24 * 7; // re-extract weekly; cache wins in-between (no flicker)

// The base shell skin. The legacy full-match "auto" id is retired → its shell is
// our dark base; brand now rides as an accent-only overlay on top.
function baseSkinFor(s: Settings): string {
  return s.skinId === AUTO_ID ? "mosadd-dark" : s.skinId;
}
// Brand overlay applies only on the default dark shell — an explicit static skin
// choice is the user's call and suppresses it (precedence rule #4).
function brandEligible(s: Settings): boolean {
  return s.brandMatch !== "off" && (s.skinId === "mosadd-dark" || s.skinId === AUTO_ID);
}
function isHex6(a: string | null | undefined): a is string {
  return typeof a === "string" && /^#[0-9a-f]{6}$/i.test(a);
}

function applyBrandOverlay(shadow: ShadowRoot, host: HTMLElement, accentHex: string): void {
  // Appended LAST → equal specificity to the base skin block but later in source
  // order, so accent tokens win without !important. brandAccentCss re-guards
  // contrast against our dark shell, so owner/seeded colors are safe too.
  let st = shadow.getElementById(BRAND_STYLE_ID) as HTMLStyleElement | null;
  if (!st) { st = document.createElement("style"); st.id = BRAND_STYLE_ID; shadow.appendChild(st); }
  st.textContent = brandAccentCss(accentHex);
  host.setAttribute(BRAND_ATTR, accentHex);
}
function clearBrandOverlay(shadow: ShadowRoot, host: HTMLElement): void {
  shadow.getElementById(BRAND_STYLE_ID)?.remove();
  host.removeAttribute(BRAND_ATTR);
}

/** Choose + apply the brand accent. Precedence: owner > server-seeded > local
 *  cache > freshly extracted. Never throws — on any failure the dark shell stays.
 *  `allowExtract` gates the (expensive) host-page DOM scan: false applies only
 *  already-known colors instantly (no scan), true permits a fresh extraction.
 *  Bootstrap passes false and defers the single scan to the settle tick, so we
 *  never scan twice per first visit and never scan at all on a cache hit. */
async function resolveAndApplyBrand(
  shadow: ShadowRoot, host: HTMLElement, domain: string,
  ownerAccent: string | null, seededAccent: string | null, allowExtract: boolean,
): Promise<void> {
  try {
    const authoritative = (isHex6(ownerAccent) && ownerAccent) || (isHex6(seededAccent) && seededAccent) || null;
    if (authoritative) { applyBrandOverlay(shadow, host, authoritative); return; }

    const cached = await getBrand(domain);
    if (cached) applyBrandOverlay(shadow, host, cached.accent); // instant, no flicker
    if (!allowExtract) return;

    const stale = !cached || Date.now() - cached.ts > BRAND_TTL_MS || cached.src === "fallback";
    if (stale) {
      const b = extractBrandAccent();
      if (b.ok) {
        applyBrandOverlay(shadow, host, b.accent);
        await setBrand(domain, { accent: b.accent, ts: Date.now(), src: b.src });
      } else if (!cached) {
        clearBrandOverlay(shadow, host); // no real brand here → plain mURL default
      }
    }
  } catch {
    clearBrandOverlay(shadow, host);
  }
}

/** Set the base shell, then apply or clear the brand overlay per eligibility. */
function applyLook(
  shadow: ShadowRoot, host: HTMLElement, s: Settings, domain: string,
  ownerAccent: string | null, seededAccent: string | null, allowExtract = false,
): void {
  setShadowSkin(host, baseSkinFor(s));
  if (brandEligible(s)) void resolveAndApplyBrand(shadow, host, domain, ownerAccent, seededAccent, allowExtract);
  else clearBrandOverlay(shadow, host);
}

/** Render the in-dock theme picker: "Match this site's color" + static skins. */
function renderSkinsOverlay(ov: HTMLElement, settings: Settings): void {
  ov.textContent = "";
  const head = document.createElement("div"); head.className = "c0-skins-head";
  const h3 = document.createElement("h3"); h3.textContent = t("skinsTitle");
  const x = document.createElement("button"); x.className = "c0-skins-x"; x.type = "button";
  x.setAttribute("aria-label", t("tooltipClose")); x.textContent = "×";
  x.addEventListener("click", () => { ov.style.display = "none"; });
  head.appendChild(h3); head.appendChild(x);
  ov.appendChild(head);

  const brandOn = brandEligible(settings);

  // "Match this site's color" — accent-only brand overlay on the dark shell.
  const auto = document.createElement("button");
  auto.type = "button";
  auto.className = "c0-skin-auto" + (brandOn ? " active" : "");
  const ic = document.createElement("span"); ic.className = "ic"; ic.textContent = "✦";
  const tx = document.createElement("span"); tx.className = "tx";
  const b = document.createElement("b"); b.textContent = t("skinAutoLabel");
  const hint = document.createElement("span"); hint.textContent = t("skinAutoHint");
  tx.appendChild(b); tx.appendChild(hint);
  auto.appendChild(ic); auto.appendChild(tx);
  auto.addEventListener("click", () => { void patchSettings({ brandMatch: "auto", skinId: "mosadd-dark" }); });
  ov.appendChild(auto);

  // Static skins grid. Picking one is an explicit choice → turn brand match off.
  const grid = document.createElement("div"); grid.className = "c0-skins-grid";
  for (const skin of SKINS) {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "c0-skin-tile" + (!brandOn && skin.id === settings.skinId ? " active" : "");
    const sw = document.createElement("div"); sw.className = "c0-skin-sw";
    for (const c of [skin.preview.bg, skin.preview.fg, skin.preview.primary]) {
      const i = document.createElement("i"); i.style.background = c; sw.appendChild(i);
    }
    const nm = document.createElement("div"); nm.className = "nm"; nm.textContent = skin.label;
    tile.appendChild(sw); tile.appendChild(nm);
    tile.addEventListener("click", () => { void patchSettings({ skinId: skin.id, brandMatch: "off" }); });
    grid.appendChild(tile);
  }
  ov.appendChild(grid);
}

// Deep-link landing-page probe (LINEAR-2700). Allowed origins only.
const PROBE_ORIGINS = new Set([
  "https://murl.mosadd.com",
  "https://mosadd.dev",
]);
window.addEventListener("message", (e: MessageEvent) => {
  if (e.source !== window) return;
  if (!e.data || typeof e.data !== "object") return;
  if (!PROBE_ORIGINS.has(e.origin)) return;
  if (e.data.kind === "mosadd-channel0:ping") {
    try { window.postMessage({ kind: "mosadd-channel0:pong", v: "0.16" }, e.origin); } catch { /* */ }
  }
  // Skin sync from the site (origin already checked). Source field guards
  // against echoes of our own broadcast.
  if (e.data.kind === SKIN_SYNC_EVENT && e.data.source === "site") {
    const id = normalizeSkinId(e.data.id);
    // The site picked an explicit static skin → turn brand match off so it sticks.
    void patchSettings({ skinId: id, brandMatch: "off" });
  }
});

const norm = normalizeDomain(location.href);
if (norm) void ageGateAndBootstrap(norm);

const AGE_KEY = "channel0.over16Confirmed";
const MIN_W = 300, MAX_W = 620;

async function ageGateAndBootstrap(norm: { domain: string; slug: string }): Promise<void> {
  try {
    const got = await chrome.storage.local.get(AGE_KEY);
    if (got?.[AGE_KEY] === true) { void bootstrap(norm); return; }
    if (got?.[AGE_KEY] === false) return;
  } catch { void bootstrap(norm); return; }
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
  btnRow.appendChild(yesBtn); btnRow.appendChild(noBtn);
  prompt.appendChild(heading); prompt.appendChild(body); prompt.appendChild(btnRow);
  if (document.body) document.body.appendChild(prompt);
  else document.addEventListener("DOMContentLoaded", () => document.body?.appendChild(prompt));
  prompt.querySelector("[data-yes]")?.addEventListener("click", async () => {
    try { await chrome.storage.local.set({ [AGE_KEY]: true }); } catch { /* */ }
    prompt.remove(); void bootstrap(norm);
  });
  prompt.querySelector("[data-no]")?.addEventListener("click", async () => {
    try { await chrome.storage.local.set({ [AGE_KEY]: false }); } catch { /* */ }
    prompt.remove();
  });
}

async function bootstrap(norm: { domain: string; slug: string }): Promise<void> {
  const settings = await getSettings();

  // Brand accents from the server (owner-claimed / seeded), learned on join.
  let ownerAccent: string | null = null;
  let seededAccent: string | null = null;

  const host = document.createElement("div");
  host.setAttribute("data-mosadd-channel0", "");
  host.style.cssText = "all: initial; position: fixed; inset: 0; pointer-events: none; z-index: 2147483647;";
  const shadow = host.attachShadow({ mode: "closed" });
  shadow.appendChild(buildStyles());
  // Stamp all static skin CSS once, set the dark shell, then overlay the brand.
  applySkinToShadow(shadow, host, baseSkinFor(settings));
  applyLook(shadow, host, settings, norm.domain, ownerAccent, seededAccent);
  if (document.body) document.body.appendChild(host);
  else document.addEventListener("DOMContentLoaded", () => document.body?.appendChild(host));
  // Single deferred scan: the host page may set theme-color / brand CSS late, so
  // we extract once after it settles (and only if no owner/seeded/cached brand).
  setTimeout(() => {
    void getSettings().then((s) => {
      if (brandEligible(s)) void resolveAndApplyBrand(shadow, host, norm.domain, ownerAccent, seededAccent, true);
    });
  }, 1500);

  // React to look changes from any surface (dock picker, side panel, site sync).
  function onSkin(s: Settings): void {
    applyLook(shadow, host, s, norm.domain, ownerAccent, seededAccent, true);
    if (panel) {
      panel.root.classList.toggle("c0-matched", host.hasAttribute(BRAND_ATTR));
      if (panel.skinsOverlay && panel.skinsOverlay.style.display !== "none") renderSkinsOverlay(panel.skinsOverlay, s);
    }
  }
  onSettingsChange((s) => onSkin(s));

  // Apply server-side brand the moment join returns it (owner > seeded) and
  // refresh the louder non-affiliation banner.
  function onBranding(b: Record<string, unknown>): void {
    ownerAccent = typeof b.accent_color === "string" ? b.accent_color : null;
    const ab = b.auto_brand as { accent?: unknown } | null | undefined;
    seededAccent = ab && typeof ab.accent === "string" ? ab.accent : null;
    void getSettings().then((s) => {
      applyLook(shadow, host, s, norm.domain, ownerAccent, seededAccent, true);
      if (panel) panel.root.classList.toggle("c0-matched", host.hasAttribute(BRAND_ATTR));
    });
  }

  // Tell the murl.mosadd.com landing page about the current static skin so its
  // hero / demo / trending board match the panel. Brand match is extension-only
  // (the site has no host page to read) — don't broadcast while it's active.
  if (location.host === "murl.mosadd.com") {
    const sendSkin = (s: Settings) => {
      if (brandEligible(s)) return;
      try { window.postMessage({ kind: SKIN_SYNC_EVENT, id: s.skinId, source: "extension" }, location.origin); } catch { /* */ }
    };
    sendSkin(settings);
    onSettingsChange((s) => sendSkin(s));
  }

  const bubble = renderBubble(shadow, settings);
  let panel: { handle: MountHandle; root: HTMLElement; skinsOverlay: HTMLElement } | null = null;

  function closePanel(): void {
    if (panel) { panel.handle.destroy(); panel.root.remove(); panel = null; }
  }

  async function openPanel(): Promise<void> {
    if (panel) return;
    const s = await getSettings();
    const side: "left" | "right" = s.panelSide === "left" ? "left" : "right";
    const width = Math.max(MIN_W, Math.min(MAX_W, s.panelWidth || 380));
    const root = document.createElement("div");
    root.className = "c0-dock c0-dock-" + side;
    root.style.width = width + "px";
    const grip = document.createElement("div"); grip.className = "c0-grip";
    const body = document.createElement("div"); body.className = "c0-dock-body";
    root.appendChild(grip); root.appendChild(body);
    // Skins overlay (theme picker, incl. "Match this site"). Hidden until opened.
    const skinsOverlay = document.createElement("div");
    skinsOverlay.className = "c0-skins";
    skinsOverlay.style.display = "none";
    root.appendChild(skinsOverlay);
    if (host.hasAttribute(BRAND_ATTR)) root.classList.add("c0-matched");
    shadow.appendChild(root);
    const dockAction: ToolbarAction = side === "right"
      ? { icon: "dock-left",  i18nKey: "tooltipDockLeft",  onClick: () => { void switchSide("left"); } }
      : { icon: "dock-right", i18nKey: "tooltipDockRight", onClick: () => { void switchSide("right"); } };
    const actions: ToolbarAction[] = [
      { icon: "skins", i18nKey: "tooltipSkins", onClick: () => { void toggleSkins(); } },
      dockAction,
      { icon: "close", i18nKey: "tooltipClose", onClick: () => closePanel() },
    ];
    const handle = mountChat(body, { domain: norm.domain, actions, onPresence(c) { bubble.setCount(c); }, onBranding });
    panel = { handle, root, skinsOverlay };
    setupResize(grip, root, side);
  }

  async function toggleSkins(): Promise<void> {
    if (!panel) return;
    const ov = panel.skinsOverlay;
    if (ov.style.display === "none") {
      const st = await getSettings();
      renderSkinsOverlay(ov, st);
      ov.style.display = "block";
    } else {
      ov.style.display = "none";
    }
  }

  async function togglePanel(): Promise<void> {
    if (panel) closePanel(); else await openPanel();
  }
  async function switchSide(next: "left" | "right"): Promise<void> {
    await patchSettings({ panelSide: next });
    closePanel();
    await openPanel();
  }
  function setupResize(grip: HTMLElement, root: HTMLElement, side: "left" | "right"): void {
    let start: { x: number; w: number } | null = null;
    grip.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      start = { x: e.clientX, w: root.getBoundingClientRect().width };
      try { grip.setPointerCapture(e.pointerId); } catch { /* */ }
      e.preventDefault();
    });
    grip.addEventListener("pointermove", (e) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      let w = side === "right" ? start.w - dx : start.w + dx;
      w = Math.max(MIN_W, Math.min(MAX_W, w));
      root.style.width = w + "px";
    });
    grip.addEventListener("pointerup", (e) => {
      if (!start) return;
      const w = Math.round(root.getBoundingClientRect().width);
      start = null;
      try { grip.releasePointerCapture(e.pointerId); } catch { /* */ }
      void patchSettings({ panelWidth: w });
    });
  }

  bubble.onClick = () => { void togglePanel(); };
  try {
    chrome.runtime.onMessage.addListener((m) => { if (m?.type === "channel0:toggle-panel") void togglePanel(); });
  } catch { /* */ }
}

interface BubbleHandle { setCount(c: number): void; onClick: () => void; }

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
    moved = false; btn.setPointerCapture(e.pointerId);
  });
  btn.addEventListener("pointermove", (e) => {
    if (!dragStart) return;
    const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
    if (!moved && Math.hypot(dx, dy) < 5) return;
    moved = true;
    wrap.style.left = `${dragStart.ox + dx}px`;
    wrap.style.top  = `${dragStart.oy + dy}px`;
    wrap.style.right = "auto"; wrap.style.bottom = "auto";
  });
  btn.addEventListener("pointerup", async (e) => {
    if (!dragStart) return;
    const wasDrag = moved; dragStart = null;
    btn.releasePointerCapture(e.pointerId);
    if (wasDrag) {
      const r = wrap.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
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

function buildStyles(): HTMLStyleElement {
  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    .c0-bubble-wrap { position: fixed; pointer-events: auto; z-index: 2147483646; }
    .c0-bubble {
      width: 56px; height: 56px; border-radius: 28px;
      background: var(--m-card, #0a0a0a); color: var(--m-primary, #00ff7a); border: 1px solid var(--m-border, #1a1a1a);
      box-shadow: 0 8px 24px rgba(0,0,0,.35);
      cursor: grab; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 16px; letter-spacing: .5px; user-select: none; touch-action: none;
    }
    .c0-bubble:hover { background: var(--m-bg, #111); }
    .c0-bubble:active { cursor: grabbing; }
    .c0-bubble-dot { width: 8px; height: 8px; border-radius: 4px; background: var(--m-primary, #00ff7a); margin-right: 6px; box-shadow: 0 0 8px var(--m-glow, #00ff7a); }
    .c0-bubble.has-people { box-shadow: 0 0 0 2px var(--m-primary, #00ff7a) inset, 0 8px 24px rgba(0,0,0,.35); }

    /* Docked, full-height, resizable panel (the only surface). */
    .c0-dock {
      position: fixed; top: 0; bottom: 0; pointer-events: auto; z-index: 2147483647;
      display: flex; background: var(--m-bg, #000); min-width: 300px; max-width: 620px;
      box-shadow: 0 0 40px rgba(0,0,0,.6);
    }
    .c0-dock-right { right: 0; border-left: 1px solid var(--m-border, #1a1a1a); flex-direction: row; }
    .c0-dock-left  { left: 0;  border-right: 1px solid var(--m-border, #1a1a1a); flex-direction: row-reverse; }
    .c0-dock-body { flex: 1; min-width: 0; display: flex; }
    .c0-dock-body > * { flex: 1; min-width: 0; }
    .c0-grip { flex: 0 0 6px; cursor: col-resize; background: transparent; }
    .c0-grip:hover { background: var(--m-glow, rgba(0,255,122,0.35)); }

    /* Narrow viewports (small phones / split-screen): take the full width and
       drop the resize grip — a 300px dock on a 360px screen is unusable. */
    @media (max-width: 460px) {
      .c0-dock { width: 100vw !important; max-width: 100vw; }
      .c0-grip { display: none; }
    }

    /* Louder non-affiliation banner in "match this site" mode (BM-6). */
    .c0-dock.c0-matched .c0-notice {
      border-left: 3px solid var(--m-primary, #00ff7a); padding-left: 8px;
      color: var(--m-fg, #fff); background: var(--m-card, rgba(0,0,0,0.85));
    }

    /* Theme picker overlay (in-dock). */
    .c0-skins { position: absolute; inset: 0; z-index: 6; overflow-y: auto; padding: 10px;
      background: var(--m-bg, #000); color: var(--m-fg, #fff);
      font-family: var(--m-font-mono, ui-monospace, "JetBrains Mono", monospace); }
    .c0-skins-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .c0-skins-head h3 { margin: 0; font-size: 11px; font-weight: 900; text-transform: uppercase;
      letter-spacing: 0.14em; color: var(--m-fg, #fff); }
    .c0-skins-x { background: transparent; border: 1px solid var(--m-border, rgba(255,255,255,0.2));
      color: var(--m-fg-muted, rgba(255,255,255,0.6)); width: 22px; height: 22px; cursor: pointer;
      line-height: 0; font-size: 15px; font-family: inherit; }
    .c0-skins-x:hover { color: var(--m-fg, #fff); border-color: var(--m-primary, #00ff7a); }
    .c0-skin-auto { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left;
      cursor: pointer; padding: 10px; margin-bottom: 10px; font-family: inherit;
      background: var(--m-card, #0a0a0a); color: var(--m-fg, #fff);
      border: 2px solid var(--m-border, rgba(255,255,255,0.18)); }
    .c0-skin-auto:hover { border-color: var(--m-fg-muted, rgba(255,255,255,0.45)); }
    .c0-skin-auto.active { border-color: var(--m-primary, #00ff7a); }
    .c0-skin-auto .ic { font-size: 18px; color: var(--m-primary, #00ff7a); flex-shrink: 0; }
    .c0-skin-auto .tx b { display: block; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; }
    .c0-skin-auto .tx span { font-size: 10px; color: var(--m-fg-muted, rgba(255,255,255,0.55)); }
    .c0-skins-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
    .c0-skin-tile { display: flex; flex-direction: column; gap: 5px; padding: 7px; cursor: pointer;
      font-family: inherit; text-align: left; background: var(--m-card, #0a0a0a); color: var(--m-fg, #fff);
      border: 2px solid var(--m-border, rgba(255,255,255,0.18)); }
    .c0-skin-tile:hover { border-color: var(--m-fg-muted, rgba(255,255,255,0.45)); }
    .c0-skin-tile.active { border-color: var(--m-primary, #00ff7a); }
    .c0-skin-sw { display: flex; height: 20px; border: 1px solid var(--m-border, rgba(255,255,255,0.18)); }
    .c0-skin-sw > i { flex: 1; display: block; }
    .c0-skin-tile .nm { font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }

    ${CHAT_CSS}
  `;
  return style;
}
