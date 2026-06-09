// =============================================================================
// MV3 service worker. The chat lives entirely in the page (docked in-page panel).
// Clicking the toolbar icon toggles that panel via a message to the content
// script. There is NO native side panel — the in-page docked panel is the ONLY
// surface, so two chats can never open at once.
// =============================================================================

import { getDeviceToken } from "../lib/identity-store";

chrome.runtime.onInstalled.addListener(async () => {
  try { await getDeviceToken(); } catch { /* */ }
});

// Toolbar icon click -> toggle the in-page docked panel on the active tab.
chrome.action?.onClicked.addListener((tab) => {
  if (tab?.id === undefined) return;
  chrome.tabs.sendMessage(tab.id, { type: "channel0:toggle-panel" }).catch(() => { /* not injected here */ });
});
