// Popup: shows the normalized domain for the active tab + lets the user
// override their nick for this domain. The override is persisted to
// chrome.storage.sync so it follows the user across browsers.

import { normalizeDomain } from "../lib/domain";
import { getDeviceToken, getNickFor, setNickFor } from "../lib/identity-store";

async function main(): Promise<void> {
  const domainEl = document.getElementById("domain") as HTMLSpanElement;
  const nickInput = document.getElementById("nick") as HTMLInputElement;
  const saveBtn = document.getElementById("save") as HTMLButtonElement;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const norm = tab?.url ? normalizeDomain(tab.url) : null;
  if (!norm) {
    domainEl.textContent = "(not a website)";
    nickInput.disabled = true; saveBtn.disabled = true;
    return;
  }
  domainEl.textContent = norm.domain;
  const device = await getDeviceToken();
  nickInput.value = await getNickFor(norm.domain, device);
  saveBtn.addEventListener("click", async () => {
    const v = nickInput.value.trim().slice(0, 32);
    if (!v) return;
    await setNickFor(norm.domain, v);
    saveBtn.textContent = "saved ✓";
    setTimeout(() => (saveBtn.textContent = "save nick"), 1200);
  });
}

main().catch(() => { /* swallow; popup is non-critical */ });
