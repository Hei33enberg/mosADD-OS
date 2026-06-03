// v0.4 — dynamiczny <title> = "mIRC #domain" tak żeby natywny Chrome
// side panel chrome (Pasek "channel 0 [pin] [x]") pokazywał czym jest pokój.

import { normalizeDomain } from "../lib/domain";
import { mountChat, type MountHandle, type ToolbarAction } from "../shared/chat-shell";
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

const host         = document.getElementById("host") as HTMLDivElement;
const overlay      = document.getElementById("settings-overlay") as HTMLDivElement;
const overlayClose = document.getElementById("settings-close") as HTMLButtonElement;
const openModeSeg  = document.getElementById("open-mode") as HTMLDivElement;
const resetBubble  = document.getElementById("reset-bubble") as HTMLButtonElement;

function showSettings(open: boolean): void {
  overlay.classList.toggle("is-open", open);
  if (open) void renderSettings();
}
overlayClose.addEventListener("click", () => showSettings(false));
overlay.addEventListener("click", (e) => { if (e.target === overlay) showSettings(false); });

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
    host.innerHTML = '<div style="padding:12px;color:rgba(255,255,255,0.4);font-size:11px;font-family:ui-monospace,monospace;">' + t("popupNotWebsite") + '</div>';
    document.title = "channel 0";
    return;
  }
  document.title = "mIRC #" + norm.domain;
  if (mounted?.domain === norm.domain) return;
  if (mounted) { mounted.handle.destroy(); mounted = null; }
  host.innerHTML = "";
  const actions: ToolbarAction[] = [
    { icon: "settings", i18nKey: "tooltipSettings", onClick: () => showSettings(true) },
  ];
  const handle = mountChat(host, { domain: norm.domain, actions });
  mounted = { domain: norm.domain, handle };
}

void syncChat();

try {
  chrome.tabs.onActivated.addListener(() => { void syncChat(); });
  chrome.tabs.onUpdated.addListener((_id, info) => { if (info.url) void syncChat(); });
} catch { /* */ }

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

resetBubble.addEventListener("click", async () => {
  await patchSettings({ bubble: { ...DEFAULT_SETTINGS.bubble } });
});

onSettingsChange(() => { void renderSettings(); });
