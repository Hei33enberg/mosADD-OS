/**
 * Site runtime — vanilla DOM helpers used by the Next.js client provider.
 * No React import here on purpose (keeps the package framework-free).
 */
import { DEFAULT_SKIN_ID, SKIN_STORAGE_KEY, SKIN_SYNC_EVENT } from "../contract";
import { SKIN_BY_ID } from "../registry";

export function readSkinFromStorage(): string {
  try {
    if (typeof window === "undefined") return DEFAULT_SKIN_ID;
    const v = window.localStorage.getItem(SKIN_STORAGE_KEY);
    if (v && SKIN_BY_ID[v]) return v;
  } catch { /* */ }
  return DEFAULT_SKIN_ID;
}

export function writeSkinToStorage(id: string): void {
  try {
    if (typeof window === "undefined") return;
    if (!SKIN_BY_ID[id]) return;
    window.localStorage.setItem(SKIN_STORAGE_KEY, id);
  } catch { /* */ }
}

/** Set the data-attribute on the document element + color-scheme. */
export function applySkinToDocument(id: string): void {
  if (typeof document === "undefined") return;
  const skin = SKIN_BY_ID[id];
  if (!skin) return;
  document.documentElement.setAttribute("data-murl-skin", skin.id);
  document.documentElement.style.colorScheme = skin.scheme;
}

/** Broadcast a skin change to the extension (which is listening on
 *  `window.message` from this origin). */
export function broadcastSkin(id: string): void {
  try {
    if (typeof window === "undefined") return;
    window.postMessage({ kind: SKIN_SYNC_EVENT, id, source: "site" }, window.origin);
  } catch { /* */ }
}

/** Install a listener that picks up skin events posted by the extension
 *  content script. Returns an unsubscribe fn. */
export function listenForSkinSync(onSkin: (id: string) => void): () => void {
  if (typeof window === "undefined") return () => { /* */ };
  function handler(e: MessageEvent) {
    if (e.source !== window) return;
    const d = e.data;
    if (!d || typeof d !== "object") return;
    if (d.kind !== SKIN_SYNC_EVENT) return;
    if (d.source === "site") return; // ignore our own echoes
    if (typeof d.id === "string" && SKIN_BY_ID[d.id]) onSkin(d.id);
  }
  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
}
