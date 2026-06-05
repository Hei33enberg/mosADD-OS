// Tiny chrome.i18n wrapper with typed message ids + safe fallback.

export type MsgId =
  | "extName" | "extShortName" | "extDescription" | "actionTitle"
  | "channelLabel" | "headerMirc" | "disclaimer" | "welcome" | "connecting" | "connected"
  | "live" | "disconnected" | "youAre" | "poweredBy" | "send" | "composePlaceholder"
  | "errBlocked" | "errRateLimited" | "errGeneric"
  | "popupTagline" | "popupYouAreOn" | "popupNickLabel" | "popupSave"
  | "popupSaved" | "popupNotWebsite"
  | "settingsTitle" | "settingOpenMode" | "settingOpenModeSide" | "settingOpenModeInline"
  | "settingBubblePos" | "settingBubbleDrag" | "settingBubbleReset"
  | "settingAppearance" | "settingAppearanceHelp"
  | "prejoinLabel" | "prejoinPlaceholder" | "prejoinGo" | "prejoinAlt"
  | "tooltipDockLeft" | "tooltipDockRight" | "tooltipSettings" | "tooltipClose" | "tooltipTrending" | "tooltipShare";

const FALLBACK: Record<MsgId, string> = {
  extName: "mURL — anonymous IRC for every URL · mosadd",
  extShortName: "mURL",
  extDescription: "Anonymous live chat scoped to the URL you are on. Powered by mosadd.",
  actionTitle: "mURL — open the room for this URL",
  channelLabel: "mURL",
  headerMirc: "mURL",
  disclaimer: "Independent chat — $1 is not affiliated. Powered by $2.",
  welcome: "welcome to #$1 — say hi",
  connecting: "connecting",
  connected: "connected",
  live: "$1 online",
  disconnected: "disconnected",
  youAre: "you are",
  poweredBy: "mURL · with mIRC inside · murl.mosadd.com",
  send: "send",
  composePlaceholder: "say something as $1",
  errBlocked: "this channel is disabled by the domain owner.",
  errRateLimited: "slowing you down — try again in a moment.",
  errGeneric: "could not connect ($1).",
  popupTagline: "mURL — anonymous IRC for every URL.",
  popupYouAreOn: "You are on",
  popupNickLabel: "Your nick on this domain",
  popupSave: "save nick",
  popupSaved: "saved",
  popupNotWebsite: "(not a website)",
  settingsTitle: "Settings",
  settingOpenMode: "Open chat in",
  settingOpenModeSide: "Side panel",
  settingOpenModeInline: "Floating panel",
  settingBubblePos: "Bubble position",
  settingBubbleDrag: "Drag the bubble to reposition.",
  settingBubbleReset: "Reset bubble position",
  settingAppearance: "Appearance",
  settingAppearanceHelp: "The same skin applies to murl.mosadd.com when you visit it.",
  prejoinLabel: "Join anonymously — pick a nick:",
  prejoinPlaceholder: "e.g. lucky-otter-77",
  prejoinGo: "Enter",
  prejoinAlt: "or create a permanent mosadd account",
  tooltipDockLeft: "Dock to the left",
  tooltipDockRight: "Dock to the right",
  tooltipSettings: "Settings",
  tooltipClose: "Close",
  tooltipTrending: "Trending rooms",
  tooltipShare: "Share this room",
};

export function t(id: MsgId, ...subs: string[]): string {
  try {
    const c = (globalThis as any).chrome;
    if (c?.i18n?.getMessage) {
      const m = c.i18n.getMessage(id, subs);
      if (m) return m;
    }
  } catch { /* fallthrough */ }
  let out = FALLBACK[id] ?? id;
  for (let i = 0; i < subs.length; i++) out = out.split("$" + (i + 1)).join(subs[i]);
  return out;
}
