// =============================================================================
// Auto-match (BM-1): synthesize a mURL skin from the HOST page's own styles, so
// the chat panel feels native to whatever site you're on.
//
// v1 = COLORS ONLY. Font matching is deliberately skipped — the IRC feed relies
// on a monospace stack for `[hh:mm] <nick>` alignment, and adopting a site's
// proportional font breaks it (tracked as a follow-up on BM-1).
//
// Everything runs through the WCAG contrast guard (contrast.ts) so an
// auto-extracted palette is never unreadable.
// =============================================================================

import * as C from "./contrast";
import type { RGB } from "./contrast";

export interface AutoTokens {
  bg: string; fg: string; fgMuted: string; card: string;
  primary: string; primaryFg: string; accent: string; border: string;
  danger: string; warning: string; info: string;
  nicks: string[]; grid: string; glow: string;
  scheme: "light" | "dark";
}

const DARK_FALLBACK_ACCENT: RGB = { r: 0, g: 255, b: 122 };
const LIGHT_FALLBACK_ACCENT: RGB = { r: 31, g: 122, b: 78 };

function readBg(): RGB {
  const els = [document.body, document.documentElement].filter(Boolean) as HTMLElement[];
  for (const el of els) {
    const c = C.parseColor(getComputedStyle(el).backgroundColor);
    if (c) return c;
  }
  return { r: 255, g: 255, b: 255 };
}

function readFg(): RGB {
  const el = document.body || document.documentElement;
  return C.parseColor(getComputedStyle(el).color) ?? { r: 17, g: 17, b: 17 };
}

/** Strongest signal: semantic CSS custom properties on :root. */
function rootCustomAccent(): RGB | null {
  const cs = getComputedStyle(document.documentElement);
  const names = [
    "--primary", "--brand", "--accent", "--accent-color", "--color-primary",
    "--brand-color", "--color-accent", "--bs-primary", "--ion-color-primary",
    "--theme-primary", "--tw-prose-links",
  ];
  for (const n of names) {
    const v = cs.getPropertyValue(n).trim();
    if (!v) continue;
    const c = C.parseColor(v);
    if (c && !C.isNeutral(c)) return c;
  }
  return null;
}

/** Next: the mobile-browser brand color. */
function metaThemeAccent(): RGB | null {
  const m = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (m?.content) {
    const c = C.parseColor(m.content);
    if (c && !C.isNeutral(c)) return c;
  }
  return null;
}

/** Fallback: frequency-rank non-neutral colors across primary UI elements. */
function rankedAccent(bg: RGB): RGB | null {
  let nodes: Element[] = [];
  try {
    nodes = Array.from(document.querySelectorAll(
      "a, button, [role=button], [class*=btn], [class*=button], header, nav, [class*=primary], [class*=cta]",
    )).slice(0, 140);
  } catch { return null; }
  const counts = new Map<string, { c: RGB; n: number }>();
  for (const el of nodes) {
    let st: CSSStyleDeclaration;
    try { st = getComputedStyle(el); } catch { continue; }
    for (const prop of [st.backgroundColor, st.color, st.borderTopColor]) {
      const c = C.parseColor(prop);
      if (!c || C.isNeutral(c)) continue;
      if (C.contrastRatio(c, bg) < 1.25) continue; // too close to background
      const k = c.r + "," + c.g + "," + c.b;
      const e = counts.get(k);
      if (e) e.n++; else counts.set(k, { c, n: 1 });
    }
  }
  let best: { c: RGB; n: number } | null = null;
  for (const v of counts.values()) {
    if (!best || v.n > best.n || (v.n === best.n && C.saturation(v.c) > C.saturation(best.c))) best = v;
  }
  return best?.c ?? null;
}

/** Derive 8 cohesive nick colors from the brand accent's hue, contrast-guarded. */
function buildNicks(accent: RGB, bg: RGB, scheme: "light" | "dark"): string[] {
  const { h } = C.rgbToHsl(accent);
  const s = scheme === "dark" ? 0.85 : 0.62;
  const l = scheme === "dark" ? 0.66 : 0.42;
  const out: string[] = [];
  for (let i = 0; i < 8; i++) {
    let c = C.hslToRgb(h + i * 43, s, l);
    c = C.ensureContrast(c, bg, 3); // nicks must be readable on the feed bg
    out.push(C.toHex(c));
  }
  return out;
}

export function extractAutoTokens(): AutoTokens {
  let bg = readBg();
  let fg = readFg();

  // If our bg guess is wrong (e.g. body bg transparent over a dark wrapper),
  // fg vs bg will be unreadable — flip bg to the opposite pole of fg.
  if (C.contrastRatio(fg, bg) < 3) {
    bg = C.isLight(fg) ? { r: 14, g: 14, b: 14 } : { r: 248, g: 248, b: 248 };
  }

  const scheme: "light" | "dark" = C.isLight(bg) ? "light" : "dark";
  const accent =
    rootCustomAccent() ?? metaThemeAccent() ?? rankedAccent(bg) ??
    (scheme === "dark" ? DARK_FALLBACK_ACCENT : LIGHT_FALLBACK_ACCENT);

  fg = C.ensureContrast(fg, bg, 4.5);
  const fgMuted = C.mix(fg, bg, 0.42);
  const card = C.mix(bg, scheme === "dark" ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 }, 0.045);
  const primary = accent;
  const primaryFg = C.isLight(accent) ? { r: 10, g: 10, b: 10 } : { r: 255, g: 255, b: 255 };

  const dangerBase: RGB = scheme === "dark" ? { r: 255, g: 85, b: 119 } : { r: 200, g: 49, b: 75 };
  const warningBase: RGB = scheme === "dark" ? { r: 255, g: 210, b: 63 } : { r: 176, g: 130, b: 0 };
  const infoBase: RGB = scheme === "dark" ? { r: 95, g: 180, b: 255 } : { r: 29, g: 109, b: 204 };

  return {
    bg: C.toHex(bg),
    fg: C.toHex(fg),
    fgMuted: C.toHex(fgMuted),
    card: C.toHex(card),
    primary: C.toHex(primary),
    primaryFg: C.toHex(primaryFg),
    accent: C.toHex(accent),
    border: C.rgbaStr(fg, 0.16),
    danger: C.toHex(C.ensureContrast(dangerBase, bg, 3)),
    warning: C.toHex(C.ensureContrast(warningBase, bg, 3)),
    info: C.toHex(C.ensureContrast(infoBase, bg, 3)),
    nicks: buildNicks(accent, bg, scheme),
    grid: C.rgbaStr(accent, 0.05),
    glow: C.rgbaStr(accent, 0.4),
    scheme,
  };
}

// =============================================================================
// BM-1 (accent-only): extract ONLY the host page's brand color and overlay it on
// our accent tokens, keeping the mURL dark shell intact. Unlike the full `auto`
// skin above, this never touches bg/fg/card — the panel always looks like mURL,
// just wearing the site's brand color. Contrast is guaranteed against OUR dark
// surface (#0a0a0a), never the host bg, so the accent is never unreadable here.
// =============================================================================

/** Our dark shell surface (mosadd-dark --m-card). Brand accents are contrast-
 *  checked against THIS, so any extracted/owner/seeded color reads on our panel. */
const OUR_DARK_BG: RGB = { r: 10, g: 10, b: 10 };
/** Target a hair above the 4.5 AA line so the accent still clears AA *after* the
 *  float→8-bit-hex quantization (a bare 4.5 target can round to 4.49). */
const BRAND_MIN_CONTRAST = 4.6;

export interface BrandAccent {
  accent: string;
  ok: boolean; // false = no real brand found (fallback green); don't persist as authoritative
  src: "root" | "meta" | "ranked" | "fallback";
}

/** Pull just the brand accent from the host page, made readable on our shell. */
export function extractBrandAccent(): BrandAccent {
  let raw: RGB | null = null;
  let src: BrandAccent["src"] = "fallback";
  const fromRoot = rootCustomAccent();
  if (fromRoot) { raw = fromRoot; src = "root"; }
  if (!raw) { const m = metaThemeAccent(); if (m) { raw = m; src = "meta"; } }
  if (!raw) { const r = rankedAccent(readBg()); if (r) { raw = r; src = "ranked"; } }
  if (!raw) return { accent: C.toHex(DARK_FALLBACK_ACCENT), ok: false, src: "fallback" };
  const guarded = C.ensureContrast(raw, OUR_DARK_BG, BRAND_MIN_CONTRAST);
  return { accent: C.toHex(guarded), ok: true, src };
}

/** Overlay CSS: brand accent on accent tokens ONLY, keyed on `data-murl-brand`.
 *  Re-runs the contrast guard so owner/seeded colors (not just locally-extracted
 *  ones) are always readable on our dark shell. */
export function brandAccentCss(accentHex: string): string {
  const parsed = C.parseColor(accentHex) ?? DARK_FALLBACK_ACCENT;
  const accent = C.ensureContrast(parsed, OUR_DARK_BG, BRAND_MIN_CONTRAST);
  const hex = C.toHex(accent);
  const nicks = buildNicks(accent, OUR_DARK_BG, "dark");
  const vars = [
    `--m-primary:${hex}`,
    `--m-accent:${hex}`,
    `--m-primary-fg:${C.isLight(accent) ? "#0a0a0a" : "#000000"}`,
    `--m-glow:${C.rgbaStr(accent, 0.45)}`,
    `--m-grid:${C.rgbaStr(accent, 0.06)}`,
    ...nicks.map((n, i) => `--m-nick-${i + 1}:${n}`),
  ].join(";");
  return `:host([data-murl-brand]), :root[data-murl-brand], .m-root[data-murl-brand] { ${vars} }`;
}

/** Produce the CSS for the synthetic `auto` skin (triple-selector, like every
 *  other skin) so the existing data-murl-skin="auto" switch picks it up. */
export function autoSkinCss(t: AutoTokens): string {
  const vars = [
    `--m-bg:${t.bg}`,
    `--m-fg:${t.fg}`,
    `--m-fg-muted:${t.fgMuted}`,
    `--m-card:${t.card}`,
    `--m-card-fg:${t.fg}`,
    `--m-primary:${t.primary}`,
    `--m-primary-fg:${t.primaryFg}`,
    `--m-accent:${t.accent}`,
    `--m-border:${t.border}`,
    `--m-danger:${t.danger}`,
    `--m-warning:${t.warning}`,
    `--m-info:${t.info}`,
    `--m-radius:0`,
    ...t.nicks.map((n, i) => `--m-nick-${i + 1}:${n}`),
    `--m-grid:${t.grid}`,
    `--m-scanline:transparent`,
    `--m-glow:${t.glow}`,
  ].join(";");
  return `:host([data-murl-skin="auto"]), :root[data-murl-skin="auto"], .m-root[data-murl-skin="auto"] { ${vars} }`;
}
