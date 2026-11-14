/** WCAG 2.2 relative luminance of a #rrggbb colour. */
export function relativeLuminance(hex: string): number {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`not a #rrggbb colour: ${hex}`);
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => {
    const c = parseInt(h!, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Minimum ratios used by the validator (WCAG 2.2 AA). */
export const AA_TEXT = 4.5;
export const AA_INTERFACE = 3;

/** The pairs every theme mode must pass: [foreground token, background token, minimum]. */
export const CONTRAST_PAIRS = [
  ["text", "background", AA_TEXT],
  ["text", "surface", AA_TEXT],
  ["textMuted", "background", AA_TEXT],
  ["textMuted", "surface", AA_TEXT],
  ["onAccent", "accent", AA_TEXT],
  ["accent", "background", AA_INTERFACE],
  ["pttTransmit", "background", AA_INTERFACE],
  ["pttListen", "background", AA_INTERFACE],
  ["error", "background", AA_INTERFACE],
  ["warning", "background", AA_INTERFACE],
] as const;
