import { describe, it, expect } from "vitest";
import { parseColor, contrastRatio, ensureContrast, isNeutral, toHex, rgbToHsl, hslToRgb } from "./contrast";

describe("parseColor", () => {
  it("parses 6-digit hex", () => { expect(parseColor("#00ff7a")).toEqual({ r: 0, g: 255, b: 122 }); });
  it("parses 3-digit hex", () => { expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255 }); });
  it("parses rgb()", () => { expect(parseColor("rgb(10, 20, 30)")).toEqual({ r: 10, g: 20, b: 30 }); });
  it("rejects transparent / empty / fully-transparent rgba", () => {
    expect(parseColor("transparent")).toBeNull();
    expect(parseColor("")).toBeNull();
    expect(parseColor("rgba(1,2,3,0)")).toBeNull();
    expect(parseColor(null)).toBeNull();
  });
});

describe("contrastRatio", () => {
  it("white on black is ~21:1", () => {
    expect(contrastRatio({ r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 0 })).toBeCloseTo(21, 0);
  });
  it("identical colors is 1:1", () => {
    expect(contrastRatio({ r: 10, g: 10, b: 10 }, { r: 10, g: 10, b: 10 })).toBeCloseTo(1, 5);
  });
});

describe("ensureContrast", () => {
  const bg = { r: 10, g: 10, b: 10 }; // our dark shell surface

  it("boosts a too-dark color above the target", () => {
    const out = ensureContrast({ r: 20, g: 20, b: 45 }, bg, 4.5);
    expect(contrastRatio(out, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("leaves an already-readable color unchanged", () => {
    const c = { r: 0, g: 255, b: 122 };
    expect(ensureContrast(c, bg, 4.5)).toEqual(c);
  });
});

describe("isNeutral", () => {
  it.each(["#ffffff", "#000000", "#808080", "#7f7f7f"])("treats %s as neutral", (hex) => {
    expect(isNeutral(parseColor(hex)!)).toBe(true);
  });
  it.each(["#1d4ed8", "#e11d48", "#16a34a", "#00ff7a"])("treats %s as a real brand color", (hex) => {
    expect(isNeutral(parseColor(hex)!)).toBe(false);
  });
});

describe("conversions", () => {
  it("toHex round-trips a parsed hex", () => {
    expect(toHex(parseColor("#1d4ed8")!)).toBe("#1d4ed8");
  });
  it("rgb -> hsl -> rgb is stable within rounding", () => {
    const c = { r: 29, g: 78, b: 216 };
    const { h, s, l } = rgbToHsl(c);
    const back = hslToRgb(h, s, l);
    expect(Math.abs(back.r - c.r)).toBeLessThanOrEqual(1);
    expect(Math.abs(back.g - c.g)).toBeLessThanOrEqual(1);
    expect(Math.abs(back.b - c.b)).toBeLessThanOrEqual(1);
  });
});
