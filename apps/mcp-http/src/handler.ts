// Core MCP-over-HTTP request handler — framework-agnostic (Node req/res), so the
// same logic runs under the local dev server (src/index.ts) and the Vercel
// serverless function (api/mcp.ts).
//
// Per request:
//   1. read the caller's API key (Authorization: Bearer mosadd_sk_live_…)
//   2. exchange it for a short-lived Supabase session (hub-key-exchange)
//   3. spin up a stateless MCP server + Streamable HTTP transport
//   4. run the request inside that session's AsyncLocalStorage context, so every
//      tool call resolves the CALLER's credentials (never a shared/global env) —
//      this is what makes one process safe to serve many tenants concurrently.
import type { IncomingMessage, ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMosaddServer, runWithSupabaseEnv, type SupabaseEnv } from "@mosadd/mcp";

const DEFAULT_EXCHANGE =
  "https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1/hub-key-exchange";

const API_KEY_RE = /^mosadd_sk_live_[a-f0-9]{16,}$/;

function exchangeEndpoint(): string {
  const base = process.env.MOSADD_HUB_URL;
  if (base) return `${base.replace(/\/$/, "")}/hub-key-exchange`;
  return process.env.MOSADD_HUB_EXCHANGE_URL ?? DEFAULT_EXCHANGE;
}

function setCors(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "authorization, content-type, mcp-session-id, mcp-protocol-version",
  );
  res.setHeader("Access-Control-Expose-Headers", "mcp-session-id");
}

function jsonRpcError(res: ServerResponse, status: number, code: number, message: string): void {
  setCors(res);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ jsonrpc: "2.0", error: { code, message }, id: null }));
}

// ── Per-key session cache (LINEAR-4813) ─────────────────────────────────────
// The handler used to exchange the API key for a fresh Supabase session on EVERY
// request — one hub-key-exchange round-trip (and one GoTrue magiclink mint) per
// tool call. The exchanged token lives ~an hour; caching it per key in module
// memory kills that overhead. TTL is deliberately WELL below expires_in so a
// cached token is never handed out near its expiry mid-request. Module state
// survives warm serverless invocations and is empty on a cold start — both fine.
// A revoked key keeps working for at most SESSION_TTL_SAFETY_S after revocation;
// acceptable for a cache this hot, same trade Supabase makes with JWTs.
const SESSION_TTL_SAFETY_S = 300; // refresh 5 min before the token would expire
const MAX_CACHED_SESSIONS = 1000; // hard cap — evict oldest, never grow unbounded

type CachedSession = { env: SupabaseEnv; expiresAtMs: number };
const sessionCache = new Map<string, CachedSession>();

async function exchangeKey(apiKey: string, clientName?: string): Promise<SupabaseEnv> {
  const cached = sessionCache.get(apiKey);
  if (cached && cached.expiresAtMs > Date.now()) return cached.env;
  sessionCache.delete(apiKey);

  const res = await fetch(exchangeEndpoint(), {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    // client_name (from MCP initialize clientInfo, when this request carries it) lets
    // hub-key-exchange stamp agent_name on its per-exchange mcp_sessions telemetry row.
    body: JSON.stringify(clientName ? { client_name: clientName } : {}),
  });
  if (!res.ok) {
    throw new Error(res.status === 401 ? "invalid_key" : `exchange_failed_${res.status}`);
  }
  const d = (await res.json()) as {
    url?: string;
    anon_key?: string;
    access_token?: string;
    expires_in?: number;
    user_id?: string;
  };
  if (!d.url || !d.anon_key || !d.access_token) throw new Error("exchange_incomplete");
  const env: SupabaseEnv = { url: d.url, anonKey: d.anon_key, userJwt: d.access_token };

  const expiresInS = typeof d.expires_in === "number" && d.expires_in > 0 ? d.expires_in : 3600;
  const ttlS = Math.max(60, expiresInS - SESSION_TTL_SAFETY_S); // TTL strictly < expires_in
  if (sessionCache.size >= MAX_CACHED_SESSIONS) {
    const oldest = sessionCache.keys().next().value;
    if (oldest !== undefined) sessionCache.delete(oldest);
  }
  sessionCache.set(apiKey, { env, expiresAtMs: Date.now() + ttlS * 1000 });
  return env;
}

/** Best-effort: pull clientInfo.name out of an MCP initialize request body. */
function clientNameFrom(parsedBody: unknown): string | undefined {
  const b = parsedBody as { method?: unknown; params?: { clientInfo?: { name?: unknown } } } | null;
  if (!b || b.method !== "initialize") return undefined;
  const name = b.params?.clientInfo?.name;
  return typeof name === "string" && name.trim() ? name.trim().slice(0, 120) : undefined;
}

/**
 * Handle one MCP HTTP request. `parsedBody` is the already-parsed JSON-RPC body
 * (the dev server / Vercel function reads + parses it before calling).
 */
export async function handleMcp(
  req: IncomingMessage,
  res: ServerResponse,
  parsedBody: unknown,
): Promise<void> {
  if (req.method === "OPTIONS") {
    setCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const authHeader = req.headers["authorization"];
  const apiKey = (typeof authHeader === "string" ? authHeader : "").replace(/^Bearer\s+/i, "").trim();
  if (!API_KEY_RE.test(apiKey)) {
    jsonRpcError(res, 401, -32001, "Unauthorized — send Authorization: Bearer mosadd_sk_live_… (get a key at https://mosadd.com/keys)");
    return;
  }

  let env: SupabaseEnv;
  try {
    env = await exchangeKey(apiKey, clientNameFrom(parsedBody));
  } catch (e) {
    const msg = (e as Error).message === "invalid_key" ? "Invalid or revoked API key" : "Key exchange failed";
    jsonRpcError(res, 401, -32001, msg);
    return;
  }

  // TODO(metering, LINEAR-4813): `public.hub_usage_increment(p_user_id uuid, p_period text,
  // p_messages bigint, p_ptt_minutes bigint)` exists with ZERO callers, and this handler CAN
  // see `parsedBody.method === "tools/call"` cheaply. It is NOT wired here on purpose: the RPC
  // meters MESSAGES and PTT MINUTES against the plan quotas hub-key-exchange returns —
  // incrementing it once per tools/call would burn a user's message allowance on read-only
  // calls (mDM_list_threads, mIRC_read, …), which is metering fraud in the user's disfavor.
  // The correct wiring is inside the SEND-path tool implementations in @mosadd/mcp (or their
  // EFs), where "this call produced N outbound messages / M PTT minutes" is actually known.
  // The exchange already returns user_id for exactly that attribution.

  // Stateless: a fresh server + transport per request (no session store), and
  // JSON responses (not SSE) so the gateway works behind any serverless host.
  const server = createMosaddServer({ apiKey, mode: "cloud" });
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  setCors(res);
  await server.connect(transport);
  // EVERY tool call dispatched during handleRequest runs with THIS caller's
  // session via AsyncLocalStorage — no global env, safe for concurrent tenants.
  await runWithSupabaseEnv(env, () => transport.handleRequest(req, res, parsedBody));
}
