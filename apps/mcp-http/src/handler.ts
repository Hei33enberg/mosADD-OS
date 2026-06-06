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

async function exchangeKey(apiKey: string): Promise<SupabaseEnv> {
  const res = await fetch(exchangeEndpoint(), {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) {
    throw new Error(res.status === 401 ? "invalid_key" : `exchange_failed_${res.status}`);
  }
  const d = (await res.json()) as { url?: string; anon_key?: string; access_token?: string };
  if (!d.url || !d.anon_key || !d.access_token) throw new Error("exchange_incomplete");
  return { url: d.url, anonKey: d.anon_key, userJwt: d.access_token };
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
    jsonRpcError(res, 401, -32001, "Unauthorized — send Authorization: Bearer mosadd_sk_live_… (get a key at https://mosadd.dev/hub)");
    return;
  }

  let env: SupabaseEnv;
  try {
    env = await exchangeKey(apiKey);
  } catch (e) {
    const msg = (e as Error).message === "invalid_key" ? "Invalid or revoked API key" : "Key exchange failed";
    jsonRpcError(res, 401, -32001, msg);
    return;
  }

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
