// =============================================================================
// mosadd embed loader — entrypoint for embed.mosadd.com/v1.js
//
// Usage (the snippet a creator pastes in their HTML):
//
//   <div id="mosadd-mirc" data-channel="strajkpolski" data-position="sidebar-right"></div>
//   <script src="https://embed.mosadd.com/v1.js" data-key="m_pk_live_…"></script>
//
// What this does:
//   - When the DOM is ready, finds the <script> tag whose src loaded THIS file.
//   - Pulls the publishable key from data-key.
//   - Scans the page for elements matching one of:
//       #mosadd-mirc  (id)
//       [data-mosadd-mirc]  (boolean attribute)
//       [data-mosadd-embed="mirc"]  (typed attribute, future products will use this)
//   - Instantiates a MosaddMircWidget per target.
//
// Why scan and not require an explicit init call:
//   - Lower friction for non-technical creators (WordPress, Webflow): paste
//     the div + the script and it just works.
//   - For SPAs / framework apps that mount after DOMContentLoaded, we also
//     expose `window.MosaddEmbed.mount(host)` so they can call it manually.
// =============================================================================

import { MosaddMircWidget } from "./widget";

interface MosaddEmbedApi {
  mount: (host: HTMLElement) => MosaddMircWidget | null;
  version: string;
}

const VERSION = "0.1.0";

function findScriptKey(): string | null {
  // 1) document.currentScript — works during synchronous load.
  const cur = document.currentScript as HTMLScriptElement | null;
  if (cur?.dataset?.key) return cur.dataset.key;
  // 2) Walk all <script> tags looking for the one with our pathname.
  const scripts = Array.from(document.getElementsByTagName("script"));
  for (const s of scripts) {
    if (s.src && /\/(v1)\.js(\?|$)/.test(s.src) && s.dataset?.key) return s.dataset.key;
  }
  return null;
}

function findTargets(): HTMLElement[] {
  const seen = new Set<HTMLElement>();
  const out: HTMLElement[] = [];
  const push = (n: HTMLElement) => {
    if (!seen.has(n)) { seen.add(n); out.push(n); }
  };

  const byId = document.getElementById("mosadd-mirc");
  if (byId) push(byId);

  document.querySelectorAll<HTMLElement>("[data-mosadd-mirc]").forEach(push);
  document.querySelectorAll<HTMLElement>("[data-mosadd-embed=\"mirc\"]").forEach(push);

  return out;
}

let scriptKey: string | null = null;
const mounted = new WeakSet<HTMLElement>();

function mount(host: HTMLElement): MosaddMircWidget | null {
  if (mounted.has(host)) return null;
  if (!scriptKey) scriptKey = findScriptKey();
  if (!scriptKey) {
    console.warn("[mosadd-embed] missing data-key on the <script> tag — widget not mounted.");
    return null;
  }
  try {
    const w = new MosaddMircWidget(host, scriptKey);
    mounted.add(host);
    return w;
  } catch (err) {
    // Never throw to the host page.
    console.error("[mosadd-embed] mount failed:", err);
    return null;
  }
}

function autoMount(): void {
  scriptKey = findScriptKey();
  if (!scriptKey) {
    console.warn(
      "[mosadd-embed] missing data-key on the <script> tag — set <script src=\"…/v1.js\" data-key=\"m_pk_live_…\">.",
    );
    return;
  }
  for (const t of findTargets()) mount(t);
}

// Expose a tiny API for framework apps / late mounts / live editor.
const api: MosaddEmbedApi = { mount, version: VERSION };
// Module globalName "MosaddEmbed" lands on window.MosaddEmbed via tsup's IIFE wrapper.

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoMount, { once: true });
} else {
  // The DOM is already ready (e.g. defer-loaded script).
  queueMicrotask(autoMount);
}

export default api;
