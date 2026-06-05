// =============================================================================
// Color + WCAG contrast utilities (BM-2). Pure, dependency-free, unit-testable.
// Used by auto-skin.ts to keep auto-extracted palettes readable.
// =============================================================================

export interface RGB { r: number; g: number; b: number; }

function clamp255(n: number): number { return Math.max(0, Math.min(255, Math.round(n))); }
function clamp01(n: number): number { return Math.max(0, Math.min(1, n)); }

// --- Parsing -----------------------------------------------------------------

let _ctx: CanvasRenderingContext2D | null = null;
function canvasCtx(): CanvasRenderingContext2D | null {
  if (_ctx) return _ctx;
  try {
    const c = document.createElement("canvas");
    c.width = 1; c.height = 1;
    _ctx = c.getContext("2d");
  } catch { _ctx = null; }
  return _ctx;
}

function parseHex(s: string): RGB | null {
  const m = s.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function parseRgbFn(s: string): RGB | null {
  const m = s.match(/rgba?\(([^)]+)\)/i);
  if (!m) return null;
  const parts = m[1].split(/[,/\s]+/).map((x) => x.trim()).filter(Boolean);
  if (parts.length < 3) return null;
  const a = parts.length >= 4 ? parseFloat(parts[3]) : 1;
  if (!Number.isNaN(a) && a === 0) return null; // fully transparent → no signal
  const conv = (v: string) => v.endsWith("%") ? (parseFloat(v) / 100) * 255 : parseFloat(v);
  const r = conv(parts[0]), g = conv(parts[1]), b = conv(parts[2]);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return { r: clamp255(r), g: clamp255(g), b: clamp255(b) };
}

/** Parse any CSS color string (hex, rgb/rgba, hsl, named) to RGB. Returns null
 *  for transparent / invalid. Uses a 1px canvas to normalize exotic forms. */
export function parseColor(input: string | null | undefined): RGB | null {
  if (!input) return null;
  const s = String(input).trim();
  if (!s || s === "transparent" || s === "none" || s === "currentColor" || s === "inherit") return null;
  const hex = parseHex(s); if (hex) return hex;
  const rgb = parseRgbFn(s); if (rgb) return rgb;
  // Fallback: canvas normalization with a two-sentinel validity check.
  const ctx = canvasCtx();
  if (!ctx) return null;
  try {
    ctx.fillStyle = "#000000"; ctx.fillStyle = s; const a = ctx.fillStyle;
    ctx.fillStyle = "#ffffff"; ctx.fillStyle = s; const b = ctx.fillStyle;
    if (a !== b) return null; // invalid color → each sentinel survived
    return parseHex(a) ?? parseRgbFn(a);
  } catch { return null; }
}

// --- Luminance / contrast (WCAG 2.1) -----------------------------------------

function channelLin(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relLuminance(c: RGB): number {
  return 0.2126 * channelLin(c.r) + 0.7152 * channelLin(c.g) + 0.0722 * channelLin(c.b);
}

export function contrastRatio(a: RGB, b: RGB): number {
  const la = relLuminance(a), lb = relLuminance(b);
  const hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/** Is this color "light" (bright enough to read dark text on)? */
export function isLight(c: RGB): boolean {
  return relLuminance(c) >= 0.5;
}

const BLACK: RGB = { r: 0, g: 0, b: 0 };
const WHITE: RGB = { r: 255, g: 255, b: 255 };

/** Return fg adjusted so contrast(fg, bg) >= min. Pushes fg toward black or
 *  white via binary search for the SMALLEST blend that meets the target — this
 *  preserves as much of the original hue/saturation as possible. If the target
 *  is unreachable (e.g. a mid-gray bg), returns the closest pole (best effort). */
export function ensureContrast(fg: RGB, bg: RGB, min = 4.5): RGB {
  if (contrastRatio(fg, bg) >= min) return fg;
  const target: RGB = isLight(bg) ? BLACK : WHITE; // dark text on light bg, else light text
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (contrastRatio(mix(fg, target, mid), bg) >= min) hi = mid; // enough — try less distortion
    else lo = mid;                                                // not enough — blend more
  }
  return mix(fg, target, hi);
}

// --- Conversions / mixing ----------------------------------------------------

export function toHex(c: RGB): string {
  const h = (n: number) => clamp255(n).toString(16).padStart(2, "0");
  return "#" + h(c.r) + h(c.g) + h(c.b);
}

export function rgbaStr(c: RGB, a: number): string {
  return `rgba(${clamp255(c.r)}, ${clamp255(c.g)}, ${clamp255(c.b)}, ${clamp01(a)})`;
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  const k = clamp01(t);
  return { r: a.r + (b.r - a.r) * k, g: a.g + (b.g - a.g) * k, b: a.b + (b.b - a.b) * k };
}

export function rgbToHsl(c: RGB): { h: number; s: number; l: number } {
  const r = c.r / 255, g = c.g / 255, b = c.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s, l };
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  h = ((h % 360) + 360) % 360;
  s = clamp01(s); l = clamp01(l);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return { r: clamp255((r + m) * 255), g: clamp255((g + m) * 255), b: clamp255((b + m) * 255) };
}

export function saturation(c: RGB): number { return rgbToHsl(c).s; }

/** A near-gray / near-white / near-black color — excluded from accent ranking. */
export function isNeutral(c: RGB): boolean {
  const { s } = rgbToHsl(c);
  const lum = relLuminance(c);
  return s < 0.12 || lum > 0.95 || lum < 0.03;
}
