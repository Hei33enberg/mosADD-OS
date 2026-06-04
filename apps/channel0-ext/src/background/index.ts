// =============================================================================
// MV3 service worker (v0.2).
//   (1) Klik ikony → side panel auto-open (setPanelBehavior).
//   (2) Klik bąbla w content → message → sidePanel.open({tabId}) (Chrome 116+).
//   (3) Po install: warm-up device token.
// =============================================================================

import { getDeviceToken } from "../lib/identity-store";

chrome.runtime.onInstalled.addListener(async () => {
  try { await getDeviceToken(); } catch { /* ignore */ }
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch { /* ignore — older Chrome may not have side panel API */ }
});

chrome.runtime.onStartup?.addListener(async () => {
  try { await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }); }
  catch { /* ignore */ }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "channel0:open-side-panel" && sender.tab?.id !== undefined) {
    const tabId = sender.tab.id;
    (async () => {
      try {
        await chrome.sidePanel.open({ tabId });
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true;
  }
});
