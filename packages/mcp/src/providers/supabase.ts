/**
 * Supabase provider for the alpha MCP server.
 *
 * Local BYOK mode: user supplies their own Supabase URL + anon key + user JWT
 * via env vars. The MCP server creates a per-request Supabase client and
 * invokes the m0ssad-3 Edge Functions on the user's behalf.
 *
 * In Phase 2 this is replaced by the hosted gateway (mcp.mosadd.com) which
 * holds keys server-side via the BYOK broker.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadSession, isSessionExpired } from "../config.js";

export interface SupabaseEnv {
  url: string;
  anonKey: string;
  userJwt?: string;
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
 * Invoke a m0ssad-3 Edge Function. Wraps `supabase.functions.invoke` with
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
