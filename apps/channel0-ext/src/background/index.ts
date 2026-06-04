// =============================================================================
// MV3 service worker. The chat lives entirely in the page (docked in-page panel).
// Clicking the toolbar icon toggles that panel via a message to the content
// script — we do NOT open the native Edge side panel anymore.
// =============================================================================

import { getDeviceToken } from "../lib/identity-store";

async function disableNativePanel(): Promise<void> {
  try { await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }); } catch { /* */ }
}

chrome.runtime.onInstalled.addListener(async () => {
  try { await getDeviceToken(); } catch { /* */ }
  await disableNativePanel();
});
chrome.runtime.onStartup?.addListener(() => { void disableNativePanel(); });

// Toolbar icon click -> toggle the in-page docked panel on the active tab.
chrome.action?.onClicked.addListener((tab) => {
  if (tab?.id === undefined) return;
  chrome.tabs.sendMessage(tab.id, { type: "channel0:toggle-panel" }).catch(() => { /* not injected here */ });
});
