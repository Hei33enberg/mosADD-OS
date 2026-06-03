// =============================================================================
// channel0 client (LINEAR-2694).
//
// Two-step:
//   1) POST channel0-join → { token, channel_id, status, branding }
//   2) Open WS to Worker `/c/<channel_id>/ws` with sub-protocols:
//        Sec-WebSocket-Protocol: mosadd.v1, bearer.<token>
//      The Worker echoes "mosadd.v1" to confirm. We never put the token in
//      the URL — query strings leak to CDN/CF access logs.
//
// Inbound frames the Worker emits:
//   { id, ts, from, text }                                — chat message
//   { type:"presence", count, roster:string[] }           — presence update
//   { error, retry_after? }                               — soft errors
// =============================================================================

import { getEndpoints } from "./config";

export interface JoinResult {
  token: string;
  expires_in: number;
  channel_id: string;
  domain: string;
  nick: string;
  status: "open" | "claimed" | "blocked";
  branding: Record<string, unknown>;
  scope: string;
}

export interface ChatMessage { id: string; ts: number; from?: string | null; text: string }
export interface PresenceFrame { type: "presence"; count: number; roster: string[] }
export type InboundFrame = ChatMessage | PresenceFrame | { error: string; retry_after?: number };

export class JoinError extends Error {
  constructor(public code: string, message?: string) { super(message ?? code); }
}

export async function joinDomain(args: {
  domain: string;
  deviceToken: string;
  nick: string;
}): Promise<JoinResult> {
  const { joinUrl } = await getEndpoints();
  const r = await fetch(joinUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain: args.domain, device_token: args.deviceToken, nick: args.nick }),
  });
  if (r.status === 451) throw new JoinError("domain_blocked", "Channel disabled by domain owner");
  if (r.status === 429) throw new JoinError("rate_limited", "Joining too fast — try again in a moment");
  if (!r.ok) {
    const body = await r.json().catch(() => ({})) as { error?: string };
    throw new JoinError(body.error ?? `http_${r.status}`);
  }
  return r.json() as Promise<JoinResult>;
}

export interface SocketHandlers {
  onMessage(msg: ChatMessage): void;
  onPresence(p: PresenceFrame): void;
  onOpen?(): void;
  onClose?(code: number, reason: string): void;
  onError?(e: Event): void;
}

export async function openChannelSocket(
  join: JoinResult,
  handlers: SocketHandlers,
): Promise<WebSocket> {
  const { edgeBase } = await getEndpoints();
  const wsUrl = edgeBase.replace(/^http/, "ws") + `/c/${encodeURIComponent(join.channel_id)}/ws`;
  // The Sec-WebSocket-Protocol carries our handshake + the token. This is the
  // ONLY supported auth path for the WS — the browser can't set custom headers
  // on upgrade and ?k= leaks to CF logs.
  const ws = new WebSocket(wsUrl, ["mosadd.v1", `bearer.${join.token}`]);
  ws.addEventListener("open", () => { handlers.onOpen?.(); });
  ws.addEventListener("close", (e) => { handlers.onClose?.(e.code, e.reason); });
  ws.addEventListener("error", (e) => { handlers.onError?.(e); });
  ws.addEventListener("message", (e) => {
    let parsed: InboundFrame | null = null;
    try { parsed = JSON.parse(typeof e.data === "string" ? e.data : "") as InboundFrame; }
    catch { return; }
    if (!parsed) return;
    if ("type" in parsed && parsed.type === "presence") { handlers.onPresence(parsed); return; }
    if ("id" in parsed && "text" in parsed) { handlers.onMessage(parsed); return; }
    // Errors are surfaced via onError on the socket; we just log here.
    if ("error" in parsed) console.warn("[channel0]", parsed);
  });
  return ws;
}

export function sendChat(ws: WebSocket, text: string, from: string): boolean {
  if (ws.readyState !== WebSocket.OPEN) return false;
  ws.send(JSON.stringify({ text, from }));
  return true;
}
