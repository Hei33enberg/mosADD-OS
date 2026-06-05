/**
 * @mosadd/skins — Skin contract.
 *
 * A skin = an override of a fixed set of CSS variables ("--m-*"). The
 * background, foreground, accent etc. are semantic, not literal — every
 * surface (extension shadow DOM, embed widget, Next.js site) consumes the
 * same names so a single skin works everywhere.
 *
 * The base values live in `default.css`. Each skin file in `src/skins/*.css`
 * only overrides what it changes; everything else cascades from the base.
 */

/** All tokens a skin can override. Names match the CSS custom properties. */
export type SkinToken =
  // Surface
  | "--m-bg"
  | "--m-fg"
  | "--m-fg-muted"
  | "--m-card"
  | "--m-card-fg"
  // Brand
  | "--m-primary"
  | "--m-primary-fg"
  | "--m-accent"
  // Lines / edges
  | "--m-border"
  // Status
  | "--m-danger"
  | "--m-warning"
  | "--m-info"
  // Geometry
  | "--m-radius"
  // Type
  | "--m-font-sans"
  | "--m-font-mono"
  // Per-nick palette (deterministic hue cycle, 8 slots).
  | "--m-nick-1" | "--m-nick-2" | "--m-nick-3" | "--m-nick-4"
  | "--m-nick-5" | "--m-nick-6" | "--m-nick-7" | "--m-nick-8"
  // Decorative brand motifs (optional per-skin)
  | "--m-grid"        // grid line color for .grid-bg
  | "--m-scanline"    // scanline overlay color
  | "--m-glow";       // accent glow used by .live-dot etc.

/** Color scheme — drives `color-scheme` + user-agent UI hints. */
export type SkinScheme = "dark" | "light";

/** Bucket — used to group the picker UI. */
export type SkinCategory = "consumer" | "nerd";

export interface SkinDef {
  /** Stable id used in storage + the `data-murl-skin` attribute. */
  id: string;
  /** Human label shown in the picker. */
  label: string;
  /** Short tagline ("light & papery", "terminal amber" …). */
  tagline: string;
  scheme: SkinScheme;
  category: SkinCategory;
  /** Preview swatch (3 hex strings) used by the picker tile. */
  preview: { bg: string; fg: string; primary: string };
  /** The raw CSS for this skin — a single string already containing the
   *  three selectors `:root`/`:host`/`.m-root` so it works on every surface. */
  css: string;
}

/** Default skin id — what loads when the user hasn't picked one. */
export const DEFAULT_SKIN_ID = "mosadd-dark";

/** Storage key (localStorage on the site, chrome.storage.sync for the ext). */
export const SKIN_STORAGE_KEY = "murl-skin";

/** Cross-surface postMessage event used by the extension-site sync bridge. */
export const SKIN_SYNC_EVENT = "mosadd-murl:skin";
