/**
 * Skin registry. The single source of truth that all surfaces consume.
 *
 * Order matters — this is the order of the picker tiles. The first entry is
 * the default fallback if the storage value is invalid.
 */
import { DEFAULT_CSS } from "./default";
import { MOSADD_DARK_CSS } from "./skins/mosadd-dark";
import { PAPER_LIGHT_CSS } from "./skins/paper-light";
import { RETRO_IRC_1990_CSS } from "./skins/retro-irc-1990";
import { TERMINAL_AMBER_CSS } from "./skins/terminal-amber";
import { SUNSET_CSS } from "./skins/sunset";
import { GLASS_CSS } from "./skins/glass";
import { FOCUS_MONO_CSS } from "./skins/focus-mono";
import { BRUTALIST_YELLOW_CSS } from "./skins/brutalist-yellow";
import { MINIMAL_DARK_CSS } from "./skins/minimal-dark";
import type { SkinDef } from "./contract";
import { DEFAULT_SKIN_ID } from "./contract";

export const SKINS: SkinDef[] = [
  {
    id: "mosadd-dark",
    label: "mosadd dark",
    tagline: "the original — terminal black + neon green",
    scheme: "dark", category: "nerd",
    preview: { bg: "#000000", fg: "#f2f2f2", primary: "#00ff7a" },
    css: MOSADD_DARK_CSS,
  },
  {
    id: "paper-light",
    label: "paper",
    tagline: "bright & easy on the eyes",
    scheme: "light", category: "consumer",
    preview: { bg: "#f6f4ee", fg: "#1a1a1a", primary: "#1f7a4e" },
    css: PAPER_LIGHT_CSS,
  },
  {
    id: "sunset",
    label: "sunset",
    tagline: "pink & violet, social vibes",
    scheme: "dark", category: "consumer",
    preview: { bg: "#18101e", fg: "#fff5fb", primary: "#ff5fa2" },
    css: SUNSET_CSS,
  },
  {
    id: "glass",
    label: "glass",
    tagline: "deep blue, premium feel",
    scheme: "dark", category: "consumer",
    preview: { bg: "#0a0f1c", fg: "#f0f4ff", primary: "#67c1ff" },
    css: GLASS_CSS,
  },
  {
    id: "focus-mono",
    label: "focus",
    tagline: "pure black & white, max legibility",
    scheme: "light", category: "consumer",
    preview: { bg: "#ffffff", fg: "#0a0a0a", primary: "#0a0a0a" },
    css: FOCUS_MONO_CSS,
  },
  {
    id: "minimal-dark",
    label: "minimal",
    tagline: "quiet grayscale dark",
    scheme: "dark", category: "consumer",
    preview: { bg: "#111111", fg: "#ededed", primary: "#ededed" },
    css: MINIMAL_DARK_CSS,
  },
  {
    id: "retro-irc-1990",
    label: "retro IRC '90",
    tagline: "early-net IRC client",
    scheme: "light", category: "nerd",
    preview: { bg: "#c0c0c0", fg: "#000000", primary: "#000080" },
    css: RETRO_IRC_1990_CSS,
  },
  {
    id: "terminal-amber",
    label: "terminal amber",
    tagline: "amber CRT, monochrome",
    scheme: "dark", category: "nerd",
    preview: { bg: "#0c0700", fg: "#ffb000", primary: "#ffb000" },
    css: TERMINAL_AMBER_CSS,
  },
  {
    id: "brutalist-yellow",
    label: "brutalist",
    tagline: "black + electric yellow",
    scheme: "dark", category: "nerd",
    preview: { bg: "#050505", fg: "#fafafa", primary: "#f6ff00" },
    css: BRUTALIST_YELLOW_CSS,
  },
];

/** Map for O(1) lookup. */
export const SKIN_BY_ID: Record<string, SkinDef> = Object.fromEntries(
  SKINS.map((s) => [s.id, s]),
);

/** Return the skin def for an id (falls back to default if unknown). */
export function getSkin(id: string | null | undefined): SkinDef {
  if (id && SKIN_BY_ID[id]) return SKIN_BY_ID[id];
  return SKIN_BY_ID[DEFAULT_SKIN_ID] ?? SKINS[0];
}

/** Just the CSS string for a given skin id (with the base layer prepended). */
export function getSkinCss(id: string | null | undefined): string {
  return DEFAULT_CSS + "\n" + getSkin(id).css;
}

/** All skin CSS concatenated (base + every skin). Useful for stamping a
 *  single <style> on the site that switches via data-murl-skin without
 *  re-injection. */
export function getAllSkinsCss(): string {
  return DEFAULT_CSS + "\n" + SKINS.map((s) => s.css).join("\n");
}

export { DEFAULT_CSS };
