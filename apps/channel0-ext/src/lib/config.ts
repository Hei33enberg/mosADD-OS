// =============================================================================
// channel0 client config.
//
// The extension talks to two endpoints:
//   - JOIN_URL: Supabase edge fn `channel0-join` → mints the channel token.
//   - EDGE_BASE: Cloudflare Worker hosting the ChannelDO → WebSocket.
//
// Both can be overridden at build time via Vite `define`s, and at runtime via
// chrome.storage.sync (`channel0.endpoints`) so devs can point a local install
// at `wrangler dev` without rebuilding.
// =============================================================================

export interface Endpoints {
  joinUrl: string;
  edgeBase: string;
}

const DEFAULT_ENDPOINTS: Endpoints = {
  // Production prod project — flips on deploy.
  joinUrl: "https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1/channel0-join",
  edgeBase: "https://mosadd-edge.mr-brics-33.workers.dev",
};

export async function getEndpoints(): Promise<Endpoints> {
  try {
    const got = await chrome.storage.sync.get("channel0.endpoints");
    const override = got?.["channel0.endpoints"] as Partial<Endpoints> | undefined;
    return { ...DEFAULT_ENDPOINTS, ...(override ?? {}) };
  } catch {
    return DEFAULT_ENDPOINTS;
  }
}
