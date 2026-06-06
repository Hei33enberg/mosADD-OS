/**
 * Supabase provider for the alpha MCP server.
 *
 * Local BYOK mode: user supplies their own Supabase URL + anon key + user JWT
 * via env vars. The MCP server creates a per-request Supabase client and
 * invokes the mosadd Edge Functions on the user's behalf.
 *
 * In Phase 2 this is replaced by the hosted gateway (mcp.mosadd.com) which
 * holds keys server-side via the BYOK broker.
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadSession, isSessionExpired } from "../config.js";

export interface SupabaseEnv {
  url: string;
  anonKey: string;
  userJwt?: string;
}

/**
 * Per-request session context for the hosted HTTP gateway (mcp.mosadd.com).
 *
 * stdio runs one user per process, so credentials live in process.env. The
 * hosted gateway serves MANY users from one process — sharing process.env would
 * leak user A's JWT into user B's concurrent request. The gateway instead
 * resolves the caller's session (Bearer api key → hub-key-exchange) and runs the
 * whole request inside `runWithSupabaseEnv(env, …)`; `readSupabaseEnv()` reads
 * this store first and falls back to process.env, so stdio is unaffected.
 */
const requestEnv = new AsyncLocalStorage<SupabaseEnv>();

/** Run `fn` (and every tool call it triggers) with a per-request Supabase session. */
export function runWithSupabaseEnv<T>(env: SupabaseEnv, fn: () => T): T {
  return requestEnv.run(env, fn);
}

export class MissingSupabaseEnvError extends Error {
  constructor(missing: string[]) {
    super(
      `Missing Supabase credentials: ${missing.join(", ")}. ` +
        `Run \`mosadd login\`, or set MOSADD_SUPABASE_URL, MOSADD_SUPABASE_ANON_KEY and MOSADD_USER_JWT.`,
    );
    this.name = "MissingSupabaseEnvError";
  }
}

export function readSupabaseEnv(): SupabaseEnv {
  // Hosted HTTP gateway: a per-request session set via runWithSupabaseEnv wins
  // over any process-global env (multi-tenant safety). stdio has no store → falls
  // through to the env/login resolution below.
  const perRequest = requestEnv.getStore();
  if (perRequest) return perRequest;

  // Canonical env vars are MOSADD_*; the legacy M0SSAD_* names are still
  // honored (deprecated) so anyone who set them before the brand sweep keeps
  // working. Env vars take precedence; fall back to the session saved by
  // `mosadd login`.
  const env = (canonical: string, legacy: string): string | undefined =>
    process.env[canonical] ?? process.env[legacy];
  const userJwtEnv = env("MOSADD_USER_JWT", "M0SSAD_USER_JWT");

  const session = loadSession();
  const url = env("MOSADD_SUPABASE_URL", "M0SSAD_SUPABASE_URL") ?? session?.url;
  const anonKey = env("MOSADD_SUPABASE_ANON_KEY", "M0SSAD_SUPABASE_ANON_KEY") ?? session?.anonKey;
  const userJwt = userJwtEnv ?? session?.accessToken;

  const missing: string[] = [];
  if (!url) missing.push("MOSADD_SUPABASE_URL");
  if (!anonKey) missing.push("MOSADD_SUPABASE_ANON_KEY");
  if (missing.length) throw new MissingSupabaseEnvError(missing);

  // Surface an expired `mosadd login` token early with an actionable message.
  if (!userJwtEnv && session && isSessionExpired(session)) {
    throw new Error("Your mosadd session has expired. Run `mosadd login` again to refresh it.");
  }
  return { url: url!, anonKey: anonKey!, userJwt };
}

export function getSupabase(env: SupabaseEnv = readSupabaseEnv()): SupabaseClient {
  return createClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: env.userJwt
      ? {
          headers: { Authorization: `Bearer ${env.userJwt}` },
        }
      : undefined,
  });
}

/**
 * Invoke a the legacy mosadd consumer-app repo Edge Function. Wraps `supabase.functions.invoke` with
 * normalized error handling so MCP tool handlers can throw clean errors that
 * agents can reason about.
 */
export async function invokeFunction<T = unknown>(
  fn: string,
  body: Record<string, unknown>,
): Promise<T> {
  const client = getSupabase();
  const { data, error } = await client.functions.invoke<T>(fn, { body });
  if (error) {
    const msg =
      error instanceof Error
        ? error.message
        : typeof (error as { message?: unknown })?.message === "string"
          ? (error as { message: string }).message
          : `Edge function ${fn} failed`;
    throw new Error(msg);
  }
  if (data == null) {
    throw new Error(`Edge function ${fn} returned no data`);
  }
  return data;
}
