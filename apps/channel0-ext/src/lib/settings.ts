// =============================================================================
// User preferences. chrome.storage.sync so they roam between browsers.
// =============================================================================

export type OpenMode = "side" | "inline";

export interface BubblePos {
  anchor: "bl" | "br" | "tl" | "tr";
  x: number;
  y: number;
}

export interface Settings {
  openMode: OpenMode;            // legacy; the panel is now always the in-page docked panel
  bubbleVisible: boolean;
  bubble: BubblePos;
  panelSide: "left" | "right";   // which edge the docked panel attaches to
  panelWidth: number;            // px, clamped 300..620
  skinId: string;                // @mosadd/skins id — controls the look of chat + bubble
  brandMatch: "auto" | "off";    // BM-1: auto-tint accents with the host site's brand color (per-domain)
}

export const DEFAULT_SETTINGS: Settings = {
  openMode: "side",
  bubbleVisible: true,
  bubble: { anchor: "br", x: 16, y: 16 },
  panelSide: "right",
  panelWidth: 380,
  skinId: "mosadd-dark",
  brandMatch: "auto",
};

const KEY = "channel0.settings";
const MIN_PANEL_W = 300, MAX_PANEL_W = 620;

let memCache: Settings | null = null;

/** Defend against a corrupted/stale chrome.storage entry: clamp the panel width
 *  and coerce every enum/bool back into range so a bad value can't break render. */
function sanitize(s: Settings): Settings {
  const width = Number(s.panelWidth);
  return {
    ...s,
    panelSide: s.panelSide === "left" ? "left" : "right",
    panelWidth: Number.isFinite(width) ? Math.max(MIN_PANEL_W, Math.min(MAX_PANEL_W, width)) : DEFAULT_SETTINGS.panelWidth,
    brandMatch: s.brandMatch === "off" ? "off" : "auto",
    skinId: typeof s.skinId === "string" && s.skinId ? s.skinId : DEFAULT_SETTINGS.skinId,
    bubbleVisible: typeof s.bubbleVisible === "boolean" ? s.bubbleVisible : DEFAULT_SETTINGS.bubbleVisible,
  };
}

export async function getSettings(): Promise<Settings> {
  if (memCache) return memCache;
  try {
    const got = await chrome.storage.sync.get(KEY);
    const s = (got?.[KEY] ?? {}) as Partial<Settings>;
    memCache = sanitize({ ...DEFAULT_SETTINGS, ...s, bubble: { ...DEFAULT_SETTINGS.bubble, ...(s.bubble ?? {}) } });
    return memCache;
  } catch {
    memCache = { ...DEFAULT_SETTINGS };
    return memCache;
  }
}

export async function patchSettings(patch: Partial<Settings>): Promise<Settings> {
  const cur = await getSettings();
  const next: Settings = sanitize({ ...cur, ...patch, bubble: { ...cur.bubble, ...(patch.bubble ?? {}) } });
  memCache = next;
  try { await chrome.storage.sync.set({ [KEY]: next }); } catch { /* memory only */ }
  return next;
}

export function onSettingsChange(cb: (s: Settings) => void): () => void {
  const handler = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area !== "sync") return;
    if (!(KEY in changes)) return;
    memCache = null;
    void getSettings().then(cb);
  };
  try { chrome.storage.onChanged.addListener(handler); } catch { /* ignore */ }
  return () => { try { chrome.storage.onChanged.removeListener(handler); } catch { /* ignore */ } };
}
