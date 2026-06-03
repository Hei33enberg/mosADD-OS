// =============================================================================
// Side panel entry.
// =============================================================================

import { normalizeDomain } from "../lib/domain";
import { mountChat, type MountHandle } from "../shared/chat-shell";
import { CHAT_CSS } from "../shared/chat-styles";
import { getSettings, patchSettings, onSettingsChange, DEFAULT_SETTINGS, type OpenMode } from "../lib/settings";
import { t, type MsgId } from "../lib/i18n";

const styleEl = document.createElement("style");
styleEl.textContent = CHAT_CSS;
document.head.appendChild(styleEl);

for (const el of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
  const k = el.dataset.i18n;
  if (!k) continue;
  el.textContent = t(k as MsgId);
}

const tabChat = document.getElementById("tab-chat") as HTMLButtonElement;
const tabSettings = document.getElementById("tab-settings") as HTMLButtonElement;
const paneChat = document.getElementById("pane-chat") as HTMLDivElement;
const paneSettings = document.getElementById("pane-settings") as HTMLDivElement;

function showChat(): void {
  tabChat.classList.add("active"); tabSettings.classList.remove("active");
  paneChat.style.display = ""; paneSettings.style.display = "none";
}
function showSettings(): void {
  tabSettings.classList.add("active"); tabChat.classList.remove("active");
  paneChat.style.display = "none"; paneSettings.style.display = "block";
  void renderSettings();
}
tabChat.addEventListener("click", showChat);
tabSettings.addEventListener("click", showSettings);

let mounted: { domain: string; handle: MountHandle } | null = null;

async function activeTabDomain(): Promise<{ domain: string; slug: string } | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return null;
    return normalizeDomain(tab.url);
  } catch { return null; }
}

async function syncChat(): Promise<void> {
  const norm = await activeTabDomain();
  if (!norm) {
    if (mounted) { mounted.handle.destroy(); mounted = null; }
    paneChat.innerHTML = `<div style="padding:16px;color:#888;font-size:13px;">${t("popupNotWebsite")}</div>`;
    return;
  }
  if (mounted?.domain === norm.domain) return;
  if (mounted) { mounted.handle.destroy(); mounted = null; }
  paneChat.innerHTML = "";
  const handle = mountChat(paneChat, { domain: norm.domain });
  mounted = { domain: norm.domain, handle };
}

void syncChat();

try {
  chrome.tabs.onActivated.addListener(() => { void syncChat(); });
  chrome.tabs.onUpdated.addListener((_id, info) => { if (info.url) void syncChat(); });
} catch { /* ignore */ }

const openModeSeg = document.getElementById("open-mode") as HTMLDivElement;
const resetBubbleBtn = document.getElementById("reset-bubble") as HTMLButtonElement;

async function renderSettings(): Promise<void> {
  const s = await getSettings();
  for (const btn of openModeSeg.querySelectorAll<HTMLButtonElement>("button[data-mode]")) {
    btn.classList.toggle("active", btn.dataset.mode === s.openMode);
  }
}

for (const btn of openModeSeg.querySelectorAll<HTMLButtonElement>("button[data-mode]")) {
  btn.addEventListener("click", async () => {
    const mode = btn.dataset.mode as OpenMode;
    await patchSettings({ openMode: mode });
    await renderSettings();
  });
}

resetBubbleBtn.addEventListener("click", async () => {
  await patchSettings({ bubble: { ...DEFAULT_SETTINGS.bubble } });
});

onSettingsChange(() => { void renderSettings(); });
