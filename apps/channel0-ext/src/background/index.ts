// =============================================================================
// MV3 service worker — minimal for the P0 viral loop.
//
// Responsibilities (today):
//   - On install, seed the deviceToken so other surfaces (popup, content
//     script) never see an empty value.
//
// Future (post-P0):
//   - Background presence polling for the "trending domains" board (C1-4).
//   - Notification routing for "ping me when someone joins {domain}" (C1-4).
// =============================================================================

import { getDeviceToken } from "../lib/identity-store";

chrome.runtime.onInstalled.addListener(async () => {
  // Best-effort warm-up. Errors are non-fatal; the content script will
  // generate a token if storage misbehaves.
  try { await getDeviceToken(); } catch { /* ignore */ }
});
