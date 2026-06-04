// channel0 client. join → WSS via Sec-WebSocket-Protocol mosadd.v1, bearer.<jwt>.
// PoW (C1-1): the join endpoint may answer 428 with {pow_bits, server_ts}; we
//             solve the hashcash locally and retry once.
// Killswitch (C1-3): 503 with reason:"killswitch" → readable JoinError.

import { getEndpoints } from "./config";
import { solvePow } from "./pow";

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
  domain: string; deviceToken: string; nick: string;
}): Promise<JoinResult> {
  const { joinUrl } = await getEndpoints();

  let r = await fetch(joinUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain: args.domain, device_token: args.deviceToken, nick: args.nick }),
  });

  // 428 Precondition Required → PoW gate.
  if (r.status === 428) {
    const challenge = await r.json().catch(() => null) as { pow_bits?: number; server_ts?: number; error?: string } | null;
    const bits = challenge?.pow_bits ?? 0;
    if (bits > 0) {
      const sol = await solvePow({
        domain: args.domain,
        device_token: args.deviceToken,
        bits,
        ts: challenge?.server_ts ?? undefined,
      });
      r = await fetch(joinUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: args.domain, device_token: args.deviceToken, nick: args.nick,
          pow_ts: sol.ts, pow_nonce: sol.nonce,
        }),
      });
    }
  }

  if (r.status === 503) {
    const body = await r.json().catch(() => ({})) as { reason?: string; error?: string };
    if (body.reason === "killswitch") throw new JoinError("killswitch", "Service temporarily disabled by operator");
    throw new JoinError("unavailable", body.error ?? "unavailable");
  }
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
    if ("error" in parsed) console.warn("[channel0]", parsed);
  });
  return ws;
}

export function sendChat(ws: WebSocket, text: string, from: string): boolean {
  if (ws.readyState !== WebSocket.OPEN) return false;
  ws.send(JSON.stringify({ text, from }));
  return true;
}
