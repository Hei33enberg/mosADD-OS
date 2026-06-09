// =============================================================================
// Per-domain brand-accent cache (BM-1). The brand color is a property of the
// SITE, not a roaming user preference, so it lives in chrome.storage.local and
// is NOT synced. Caching keeps the accent stable across visits (no green→brand
// flicker) and is also the seam the chat shell reads to seed the server (Phase 2).
// =============================================================================

export interface BrandRecord {
  accent: string; // #rrggbb, already contrast-guarded for our dark shell
  ts: number;     // epoch ms — drives the weekly re-extract
  src: string;    // "root" | "meta" | "ranked" — provenance of the color
}

const HEX = /^#[0-9a-f]{6}$/i;
const KEY = (domain: string) => `channel0.brand:${domain}`;

export async function getBrand(domain: string): Promise<BrandRecord | null> {
  try {
    const k = KEY(domain);
    const got = await chrome.storage.local.get(k);
    const rec = got?.[k] as BrandRecord | undefined;
    if (rec && typeof rec.accent === "string" && HEX.test(rec.accent)) return rec;
  } catch { /* ignore — fall through to no cache */ }
  return null;
}

export async function setBrand(domain: string, rec: BrandRecord): Promise<void> {
  try { await chrome.storage.local.set({ [KEY(domain)]: rec }); } catch { /* memory-less */ }
}

export async function clearBrand(domain: string): Promise<void> {
  try { await chrome.storage.local.remove(KEY(domain)); } catch { /* ignore */ }
}
