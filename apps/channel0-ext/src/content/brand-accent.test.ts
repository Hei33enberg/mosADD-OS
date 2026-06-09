import { describe, it, expect } from "vitest";
import { brandAccentCss } from "./auto-skin";
import { parseColor, contrastRatio } from "./contrast";

const OUR_DARK_BG = { r: 10, g: 10, b: 10 }; // mosadd-dark --m-card surface

function primaryOf(css: string): string {
  const m = css.match(/--m-primary:(#[0-9a-f]{6})/i);
  if (!m) throw new Error("overlay has no --m-primary");
  return m[1];
}

describe("brandAccentCss (BM-5 accent-only overlay)", () => {
  it("sets accent tokens but never the shell (bg/fg/card/border stay mURL)", () => {
    const css = brandAccentCss("#1d4ed8");
    for (const t of ["--m-primary:", "--m-accent:", "--m-glow:", "--m-grid:", "--m-primary-fg:"]) {
      expect(css).toContain(t);
    }
    for (let i = 1; i <= 8; i++) expect(css).toContain(`--m-nick-${i}:`);
    for (const t of ["--m-bg:", "--m-fg:", "--m-card:", "--m-border:", "--m-font"]) {
      expect(css).not.toContain(t);
    }
  });

  it("is keyed on the data-murl-brand attribute (overlay, not a skin swap)", () => {
    expect(brandAccentCss("#1d4ed8")).toContain("[data-murl-brand]");
  });

  it("guarantees the accent clears WCAG AA (4.5:1) on the dark shell, incl. near-black brands", () => {
    for (const hex of ["#1d4ed8", "#e11d48", "#16a34a", "#0b1320", "#3b0764", "#1a1a2e", "#222222"]) {
      const out = primaryOf(brandAccentCss(hex));
      expect(contrastRatio(parseColor(out)!, OUR_DARK_BG)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps an already-readable vivid color unchanged", () => {
    expect(primaryOf(brandAccentCss("#16a34a")).toLowerCase()).toBe("#16a34a");
  });

  it("falls back gracefully on an unparseable input", () => {
    const css = brandAccentCss("not-a-color");
    expect(primaryOf(css)).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
