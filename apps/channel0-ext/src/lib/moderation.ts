// =============================================================================
// Client-side moderation (LINEAR-2697 + LINEAR-2698 / C1-2 + C1-3).
//
// • report(messageId, channelSlug, reason)  — POST to /channel0-report.
// • shouldThrottleLinks(text, history)      — link-flood throttle, 3 links / 60s.
// • obviousProfanity(text)                  — tiny client-side filter, soft.
//
// The server is authoritative; the client filters are UX only (instant warning,
// no round-trip). Real moderation is the report flow + per-device rate-limit
// + the DB auto-hide trigger.
// =============================================================================

import { getEndpoints } from "./config";

export type ReportReason = "spam" | "abuse" | "illegal" | "other";

export interface ReportResult {
  ok: boolean;
  reported: boolean;      // false if this device already reported the same message
  reporter_count: number;
  error?: string;
}

export async function reportMessage(args: {
  messageId: string;
  channelSlug: string;
  deviceToken: string;
  reason: ReportReason;
}): Promise<ReportResult> {
  const { joinUrl } = await getEndpoints();
  const reportUrl = joinUrl.replace(/\/channel0-join$/, "/channel0-report");
  const r = await fetch(reportUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message_id: args.messageId,
      channel_slug: args.channelSlug,
      device_token: args.deviceToken,
      reason: args.reason,
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, reported: false, reporter_count: 0, error: data?.error ?? `http_${r.status}` };
  return data as ReportResult;
}

// ── Link-flood throttle ──────────────────────────────────────────────────────
// Soft warning: too many links in too short a window. The Worker also rate-
// limits sends (600/min); this is just a friendlier nudge.

const URL_RE = /\bhttps?:\/\/\S+/gi;
const LINK_WINDOW_MS = 60_000;
const LINK_MAX = 3;

export function countLinks(text: string): number {
  return (text.match(URL_RE) ?? []).length;
}

/** Track outbound link timestamps; returns true if the send would exceed
 *  LINK_MAX links inside the last LINK_WINDOW_MS milliseconds. */
export function shouldThrottleLinks(text: string, history: number[]): { throttled: boolean; nextAllowedIn: number } {
  const newCount = countLinks(text);
  if (newCount === 0) return { throttled: false, nextAllowedIn: 0 };
  const now = Date.now();
  const recent = history.filter((t) => now - t < LINK_WINDOW_MS);
  if (recent.length + newCount > LINK_MAX) {
    const oldest = recent[0] ?? now;
    return { throttled: true, nextAllowedIn: Math.max(0, LINK_WINDOW_MS - (now - oldest)) };
  }
  return { throttled: false, nextAllowedIn: 0 };
}

/** Push a successful send to the history so the throttle can see it next time. */
export function pushLinkHistory(text: string, history: number[]): number[] {
  const n = countLinks(text);
  if (n === 0) return history;
  const now = Date.now();
  const next = [...history.filter((t) => now - t < LINK_WINDOW_MS), ...Array(n).fill(now)];
  return next.slice(-LINK_MAX * 2); // keep at most 2x the window cap
}

// ── Profanity filter ────────────────────────────────────────────────────────
// Intentionally small + visible. Real moderation is the report flow. We just
// catch the most obvious slurs so the room is not the first thing newcomers
// see when they open a fresh domain. Easily extensible via chrome.storage.

const SOFT_BLOCKLIST: string[] = [
  // Keep this list short. The full list is the report flow + auto-hide.
  // (No slurs hard-coded here — the file is publicly visible source code.)
];

const URL_HIDE_RE = /https?:\/\//gi;

/** Returns a softly-cleaned variant + a list of reasons. Empty reasons = clean. */
export function softClean(text: string): { text: string; reasons: string[] } {
  const reasons: string[] = [];
  let out = text;
  for (const word of SOFT_BLOCKLIST) {
    const re = new RegExp("\b" + word + "\b", "gi");
    if (re.test(out)) {
      reasons.push("profanity");
      out = out.replace(re, "***");
    }
  }
  // Excessive caps: > 60% uppercase letters in a string of >= 10 chars.
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length >= 10) {
    const upper = letters.replace(/[^A-Z]/g, "").length;
    if (upper / letters.length > 0.6) reasons.push("shouty");
  }
  return { text: out, reasons };
}
