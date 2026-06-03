// =============================================================================
// Identity persistence for channel0.
//
// Two pieces survive across page loads:
//   - deviceToken (per-install, chrome.storage.local) — the rate-limit/ban key.
//   - displayNick override per domain (chrome.storage.sync) — lets you keep
//     a chosen nick across browsers when sync is enabled.
//
// Falls back to in-memory storage when chrome.storage is unavailable (e.g.
// in tests). Strict — never blocks the UI on a storage error.
// =============================================================================

import { deterministicIdentity, generateDeviceToken } from "./nick";

const DEVICE_KEY = "channel0.deviceToken";
const NICK_PREFIX = "channel0.nick:";

let memDevice: string | null = null;
const memNicks = new Map<string, string>();

export async function getDeviceToken(): Promise<string> {
  try {
    const got = await chrome.storage.local.get(DEVICE_KEY);
    const existing = got[DEVICE_KEY] as string | undefined;
    if (existing) return existing;
    const fresh = generateDeviceToken();
    await chrome.storage.local.set({ [DEVICE_KEY]: fresh });
    return fresh;
  } catch {
    if (!memDevice) memDevice = generateDeviceToken();
    return memDevice;
  }
}

export async function getNickFor(domain: string, deviceToken: string): Promise<string> {
  try {
    const key = NICK_PREFIX + domain;
    const got = await chrome.storage.sync.get(key);
    const saved = got[key] as string | undefined;
    if (saved) return saved;
  } catch { /* fall through to memory + deterministic */ }
  const inMem = memNicks.get(domain);
  if (inMem) return inMem;
  const det = deterministicIdentity(deviceToken, domain).nick;
  memNicks.set(domain, det);
  return det;
}

export async function setNickFor(domain: string, nick: string): Promise<void> {
  memNicks.set(domain, nick);
  try {
    const key = NICK_PREFIX + domain;
    await chrome.storage.sync.set({ [key]: nick });
  } catch { /* memory fallback only */ }
}
