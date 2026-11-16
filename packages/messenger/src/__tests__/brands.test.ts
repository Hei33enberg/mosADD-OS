import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { contrastRatio, validateMessenger, validateSkin } from "../index";

const pkg = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const load = (rel: string) => JSON.parse(readFileSync(join(pkg, rel), "utf8"));

describe("ready-made skins", () => {
  const ids = readdirSync(join(pkg, "skins"));
  it("ships five", () => expect(ids.sort()).toEqual(["august", "club-bright", "fleet-road", "gate-night", "port-night"]));
  for (const id of ids) {
    it(`${id}: skin.json and messenger.json validate with no errors and no warnings`, () => {
      const s = validateSkin(load(`skins/${id}/skin.json`));
      expect(s.issues).toEqual([]);
      const m = validateMessenger(load(`skins/${id}/messenger.json`));
      expect(m.issues).toEqual([]);
      expect(m.messenger!.theme.id).toBe(id);
    });
  }
  it("august is the design system's dark theme, in hex", () => {
    const s = load("skins/august/skin.json");
    expect(s.tokens.dark.background).toBe("#000000");
    expect(s.tokens.dark.accent).toBe("#20c568"); // the green of the mosADD sun, canon
    expect(s.modes).toEqual(["dark"]);
  });
  it("sabotage: darkening august's muted text breaks the contrast guard", () => {
    const s = load("skins/august/skin.json");
    s.tokens.dark.textMuted = "#1a1a1a";
    expect(validateSkin(s).issues.map((i) => i.code)).toContain("CONTRAST");
  });
});

describe("brands/mosadd (the contract with the POXI studio)", () => {
  const KEYS = ["bg", "ink", "text", "muted", "soft", "faint", "line", "line-strong", "chip", "chip-hover", "card", "accent", "ok", "danger", "warn", "shadow-card", "shadow-soft", "radius", "font", "mono", "aurora"];
  for (const file of ["brand.json", "brand.light.json"]) {
    it(`${file} has exactly the agreed keys, and every colour is a plain value`, () => {
      const b = load(`brands/mosadd/${file}`);
      expect(Object.keys(b).sort()).toEqual(["copy", "id", "logo", "mode", "name", "tokens"]);
      expect(Object.keys(b.tokens).sort()).toEqual([...KEYS].sort());
      expect(b.id).toBe("mosadd");
      for (const k of ["bg", "ink", "text", "muted", "soft", "faint", "line", "chip", "card", "accent", "ok", "danger", "warn"])
        expect(b.tokens[k]).toMatch(/^hsl\(\d+(\.\d+)? \d+(\.\d+)?% \d+(\.\d+)?%\)$/);
    });
  }
  it("dark text stays readable on the dark brand (the same AA bar as skins)", () => {
    const hexOf = (v: string) => {
      const [h, s, l] = v.match(/[\d.]+/g)!.map(Number) as [number, number, number];
      const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
      const f = (n: number) => { const k = (n + h / 30) % 12; return Math.round(255 * (l / 100 - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1))))).toString(16).padStart(2, "0"); };
      return `#${f(0)}${f(8)}${f(4)}`;
    };
    const t = load("brands/mosadd/brand.json").tokens;
    expect(contrastRatio(hexOf(t.text), hexOf(t.bg))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(hexOf(t.muted), hexOf(t.bg))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(hexOf(t.muted), hexOf(t.card))).toBeGreaterThanOrEqual(4.5);
  });
});
