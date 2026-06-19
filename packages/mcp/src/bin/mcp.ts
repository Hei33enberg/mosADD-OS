#!/usr/bin/env node
/**
 * `mosadd-mcp` (also runnable as `npx @mosadd/mcp`)
 *
 * Starts a mosadd MCP server over stdio. The standard transport for local
 * MCP clients (Claude Code, Cursor, Cline, Windsurf, Goose, ...).
 *
 * For HTTP/SSE transport (hosted mcp.mosadd.com), see packages/mcp-gateway
 * in the proprietary repo.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";
import { createMosaddServer } from "../server.js";
import { loadSession, saveSession, isSessionExpired } from "../config.js";

const DEFAULT_EXCHANGE =
  "https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1/hub-key-exchange";

/**
 * Hosted-hub path: when MOSADD_API_KEY is set, exchange it for a short-lived
 * session (URL + anon key + access token) so the tools act as the key's owner.
 * Removes the DevTools-JWT wall — paste one stable key, done. Falls through
 * silently if the key is unset or the exchange is unreachable (so BYOK/self-host
 * keep working).
 */
async function bootstrapFromApiKey(): Promise<void> {
  const apiKey = process.env.MOSADD_API_KEY;
  if (!apiKey || process.env.MOSADD_USER_JWT) return;
  const endpoint = process.env.MOSADD_HUB_URL
    ? `${process.env.MOSADD_HUB_URL.replace(/\/$/, "")}/hub-key-exchange`
    : DEFAULT_EXCHANGE;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: "{}",
    });
    if (!res.ok) {
      process.stderr.write(
        JSON.stringify({ level: "warn", msg: "mosadd hub key exchange failed", status: res.status }) + "\n",
      );
      return;
    }
    const d = (await res.json()) as { url?: string; anon_key?: string; access_token?: string };
    if (d.url) process.env.MOSADD_SUPABASE_URL = d.url;
    if (d.anon_key) process.env.MOSADD_SUPABASE_ANON_KEY = d.anon_key;
    if (d.access_token) process.env.MOSADD_USER_JWT = d.access_token;
  } catch (err) {
    process.stderr.write(
      JSON.stringify({ level: "warn", msg: "mosadd hub unreachable", error: String(err) }) + "\n",
    );
  }
}

/**
 * `mosadd login` path: refresh the saved session at boot so a stored token that
 * expired since the last launch (Supabase access tokens last ~1h) is renewed
 * silently from its refresh token — instead of failing the first tool call with
 * "session expired, run `mosadd login` again". This makes a single `mosadd login`
 * durable across restarts (the founder's "set once, forget" expectation). No-op
 * when an explicit env JWT or hub key already resolved a session, when there is no
 * saved session, or when the saved token is still valid.
 */
async function bootstrapFromSavedSession(): Promise<void> {
  if (process.env.MOSADD_USER_JWT) return;
  const session = loadSession();
  if (!session?.refreshToken) return;
  // Still-valid token → the provider uses it as-is; don't churn the refresh token.
  if (!isSessionExpired(session)) return;
  try {
    const client = createClient(session.url, session.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await client.auth.refreshSession({ refresh_token: session.refreshToken });
    if (error || !data.session) {
      process.stderr.write(
        JSON.stringify({ level: "warn", msg: "mosadd session refresh failed — run `mosadd login`", error: error?.message }) + "\n",
      );
      return;
    }
    saveSession({
      url: session.url,
      anonKey: session.anonKey,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token ?? session.refreshToken,
      expiresAt: data.session.expires_at,
      email: data.user?.email ?? session.email,
    });
  } catch (err) {
    process.stderr.write(
      JSON.stringify({ level: "warn", msg: "mosadd session refresh error — run `mosadd login`", error: String(err) }) + "\n",
    );
  }
}

async function main(): Promise<void> {
  // Auth subcommands: `mosadd login | logout | whoami`. Everything else starts the server.
  const sub = process.argv[2];
  if (sub === "login" || sub === "logout" || sub === "whoami") {
    const { runAuthCommand } = await import("./login.js");
    await runAuthCommand(sub, process.argv.slice(3));
    return;
  }

  // Hosted: trade MOSADD_API_KEY for a live session before the server reads env.
  await bootstrapFromApiKey();
  // `mosadd login`: renew a saved session whose access token expired since last launch.
  await bootstrapFromSavedSession();

  const server = createMosaddServer({
    apiKey: process.env.MOSADD_API_KEY,
    hubUrl: process.env.MOSADD_HUB_URL,
    mode: (process.env.MOSADD_MODE as "cloud" | "local" | "self-host" | undefined),
    logLevel: (process.env.MOSADD_LOG_LEVEL as "debug" | "info" | "warn" | "error" | undefined),
    // stdio is single-tenant: the session lives in env (set by bootstrapFromApiKey
    // above), so auto-publish this identity's prekeys on boot → mDM is reachable.
    autoPublishKeys: true,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // The server now runs until stdin closes.
  process.stderr.write(
    JSON.stringify({
      level: "info",
      msg: "mosadd MCP server ready",
      version: "3.0.0-alpha.0",
      ts: new Date().toISOString(),
    }) + "\n",
  );
}

main().catch((err) => {
  process.stderr.write(
    JSON.stringify({
      level: "error",
      msg: "mosadd MCP server failed to start",
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }) + "\n",
  );
  process.exit(1);
});
