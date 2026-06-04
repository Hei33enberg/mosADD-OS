// =============================================================================
// Trending domains client (LINEAR-2699 / C1-4).
//
// Top channels by message activity in the last N minutes (default 60).
// Filters out blocked rooms (verified-owner disabled — see C2-1).
// Render in the side panel as a discovery board: click a row to open that
// domain in a new tab, which makes the side panel mount the corresponding
// channel automatically via the tab-onUpdated listener.
// =============================================================================

import { getEndpoints } from "./config";

export interface TrendingItem {
  slug: string;
  domain: string;
  messages: number;
  last_ts: string;
  status: "open" | "claimed" | "blocked";
  branding: Record<string, unknown>;
}

export interface TrendingResponse {
  minutes: number;
  since: string;
  items: TrendingItem[];
}

export async function fetchTrending(minutes = 60): Promise<TrendingResponse> {
  const { joinUrl } = await getEndpoints();
  const trendingUrl = joinUrl.replace(/\/channel0-join$/, "/channel0-trending");
  const r = await fetch(`${trendingUrl}?minutes=${minutes}`, { method: "GET" });
  if (!r.ok) throw new Error(`trending_http_${r.status}`);
  return (await r.json()) as TrendingResponse;
}

/** "5 min ago", "2 h ago" etc. */
export function relativeTime(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime();
  const sec = Math.max(1, Math.floor((now - t) / 1000));
  if (sec < 60)        return `${sec}s ago`;
  if (sec < 3600)      return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400)     return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}
