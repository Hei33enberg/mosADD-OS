// v0.4 — dynamiczny <title> = "mIRC #domain" tak żeby natywny Chrome
// side panel chrome (Pasek "channel 0 [pin] [x]") pokazywał czym jest pokój.

import { normalizeDomain } from "../lib/domain";
import { mountChat, type MountHandle, type ToolbarAction } from "../shared/chat-shell";
import { CHAT_CSS } from "../shared/chat-styles";
import { getSettings, patchSettings, onSettingsChange, DEFAULT_SETTINGS, type OpenMode } from "../lib/settings";
import { t, type MsgId } from "../lib/i18n";
import { fetchTrending, relativeTime } from "../lib/trending";

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
    document.title = "mURL";
    return;
  }
  document.title = "mURL #" + norm.domain;
  if (mounted?.domain === norm.domain) return;
  if (mounted) { mounted.handle.destroy(); mounted = null; }
  host.innerHTML = "";
  const actions: ToolbarAction[] = [
    { icon: "share",    i18nKey: "tooltipShare",    onClick: () => shareRoom(norm.domain) },
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

const resetAge = document.getElementById("reset-age") as HTMLButtonElement | null;
resetAge?.addEventListener("click", async () => {
  try { await chrome.storage.local.remove("channel0.over16Confirmed"); } catch { /* */ }
  resetAge.textContent = "reset — reload the page";
  resetAge.disabled = true;
});

onSettingsChange(() => { void renderSettings(); });


// ── Trending overlay (LINEAR-2699) ──────────────────────────────────────────
const trendingOverlay = document.getElementById("trending-overlay") as HTMLDivElement;
const trendingClose   = document.getElementById("trending-close")   as HTMLButtonElement;
const trendingList    = document.getElementById("trending-list")    as HTMLDivElement;
const trendingStatus  = document.getElementById("trending-status")  as HTMLDivElement;

let lastTrendingAt = 0;

function showTrending(open: boolean): void {
  trendingOverlay.classList.toggle("is-open", open);
  if (open) void loadTrending();
}
trendingClose.addEventListener("click", () => showTrending(false));
trendingOverlay.addEventListener("click", (e) => { if (e.target === trendingOverlay) showTrending(false); });

async function loadTrending(): Promise<void> {
  const now = Date.now();
  // Throttle: don't re-fetch more than once / 5s.
  if (now - lastTrendingAt < 5_000 && trendingList.children.length > 0) return;
  lastTrendingAt = now;
  trendingStatus.textContent = "loading…";
  trendingList.innerHTML = "";
  try {
    const data = await fetchTrending(60);
    if (!data.items.length) {
      trendingStatus.textContent = "no activity in the last hour — be the first";
      return;
    }
    trendingStatus.textContent = `${data.items.length} active rooms · last 60 min`;
    for (const it of data.items) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "trending-row";
      const d = document.createElement("span");
      d.className = "trending-domain";
      d.textContent = "#" + it.domain;
      const m = document.createElement("span");
      m.className = "trending-msgs";
      m.textContent = String(it.messages) + " msg";
      const tEl = document.createElement("span");
      tEl.className = "trending-time";
      tEl.textContent = relativeTime(it.last_ts);
      row.appendChild(d); row.appendChild(m); row.appendChild(tEl);
      row.addEventListener("click", () => {
        // Open a new tab on the domain so the user lands on it AND the side
        // panel mounts that domain's chat via the tab listener.
        try { void chrome.tabs.create({ url: "https://" + it.domain }); } catch { /* */ }
        showTrending(false);
      });
      trendingList.appendChild(row);
    }
  } catch (e) {
    trendingStatus.textContent = "couldn't load — try again in a sec";
  }
}


// ── Share room (LINEAR-2700 / C1-5) ─────────────────────────────────────────
function shareRoom(domain: string): void {
  const url = "https://mosadd.dev/murl/" + domain;
  const text = "Join #" + domain + " on mURL — anonymous IRC for everyone on this site right now: " + url;
  const navAny = navigator as Navigator & { share?: (d: ShareData) => Promise<void>; clipboard?: Clipboard };
  if (navAny.share) {
    void navAny.share({ title: "mURL #" + domain, text, url }).catch(() => { void copyShare(url); });
  } else {
    void copyShare(url);
  }
}
async function copyShare(url: string): Promise<void> {
  try { await navigator.clipboard.writeText(url); }
  catch { /* no clipboard, give up silently */ }
}
