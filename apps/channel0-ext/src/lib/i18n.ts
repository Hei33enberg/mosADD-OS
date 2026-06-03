// =============================================================================
// Tiny chrome.i18n wrapper.
// =============================================================================

export type MsgId =
  | "extName" | "extShortName" | "extDescription" | "actionTitle"
  | "channelLabel" | "disclaimer" | "welcome" | "connecting" | "connected"
  | "live" | "disconnected" | "youAre" | "poweredBy" | "send" | "composePlaceholder"
  | "errBlocked" | "errRateLimited" | "errGeneric"
  | "popupTagline" | "popupYouAreOn" | "popupNickLabel" | "popupSave"
  | "popupSaved" | "popupNotWebsite"
  | "settingsTitle" | "settingOpenMode" | "settingOpenModeSide" | "settingOpenModeInline"
  | "settingBubblePos" | "settingBubbleDrag" | "settingBubbleReset";

const FALLBACK: Record<MsgId, string> = {
  extName: "channel 0 [mIRC] — with mosadd inside",
  extShortName: "channel 0",
  extDescription: "Anonymous live chat scoped to the domain you're on.",
  actionTitle: "channel 0 — open chat for this domain",
  channelLabel: "channel 0",
  disclaimer: "Independent chat — $1 is not affiliated. Powered by $2.",
  welcome: "welcome to #$1 — say hi 👋",
  connecting: "· connecting…",
  connected: "· connected",
  live: "· $1 live",
  disconnected: "· disconnected",
  youAre: "you are",
  poweredBy: "powered by mosadd",
  send: "send",
  composePlaceholder: "say something as $1…",
  errBlocked: "this channel is disabled by the domain owner.",
  errRateLimited: "slowing you down — try again in a moment.",
  errGeneric: "couldn't connect ($1). try again in a sec.",
  popupTagline: "Anonymous live chat for every domain.",
  popupYouAreOn: "You are on",
  popupNickLabel: "Your nick on this domain",
  popupSave: "save nick",
  popupSaved: "saved ✓",
  popupNotWebsite: "(not a website)",
  settingsTitle: "Settings",
  settingOpenMode: "Open chat in",
  settingOpenModeSide: "Side panel",
  settingOpenModeInline: "Floating panel",
  settingBubblePos: "Bubble position",
  settingBubbleDrag: "Drag the bubble to reposition.",
  settingBubbleReset: "Reset bubble position",
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
  for (let i = 0; i < subs.length; i++) out = out.replaceAll(`$${i + 1}`, subs[i]);
  return out;
}
