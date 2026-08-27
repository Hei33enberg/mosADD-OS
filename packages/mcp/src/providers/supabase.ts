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
import { randomUUID } from "node:crypto";
import { hostname } from "node:os";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadSession, isSessionExpired } from "../config.js";

/**
 * Tożsamość TEGO procesu — stała przez całe życie sesji, nowa przy każdym starcie.
 *
 * ⛔ NIE MOŻE być pochodną konta ani hosta. Dwie sesje generałów potrafią stać na tej samej
 * maszynie i pod tym samym kontem (box floty), więc identyfikator z hosta zlepiłby je z powrotem
 * w jedną — czyli odtworzył dokładnie ten błąd, który to naprawia. Nazwa hosta zostaje tylko jako
 * czytelny przedrostek do diagnostyki; o rozróżnieniu decyduje losowy ogon.
 */
let cachedSessionId: string | null = null;
export function sessionId(): string {
  // ⛔ BRAMA HOSTOWANA ≠ PROCES (audyt 2026-08-27). Na mcp.mosadd.com jeden proces lambdy obsługuje
  // WIELU najemców, a kolejne wywołania tej samej rozmowy potrafią trafić w RÓŻNE procesy — więc
  // tożsamość per-proces byłaby tam jednocześnie wspólna (wyciek między najemcami) i niestała
  // (fałszywe 409 przy każdym przełączeniu instancji). W kontekście bramy prawda żyje w ALS:
  // brama wyznacza stabilny `sessionKey` per klucz API; brak klucza = puste "" (semantyka legacy,
  // zero roszczeń per-sesja). Losowy identyfikator per-proces zostaje TYLKO dla stdio.
  const perRequest = requestEnv.getStore();
  if (perRequest) return perRequest.sessionKey ?? "";
  if (cachedSessionId) return cachedSessionId;
  let host = "mcp";
  try { host = (hostname() || "mcp").slice(0, 24); } catch { /* bez nazwy hosta też działa */ }
  cachedSessionId = `${host}:${randomUUID()}`;
  return cachedSessionId;
}

export interface SupabaseEnv {
  url: string;
  anonKey: string;
  userJwt?: string;
  /** Stabilna tożsamość sesji dla bramy hostowanej (per klucz API) — patrz sessionId(). */
  sessionKey?: string;
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
    // ⛔ x-mosadd-origin: KAŻDE wywołanie z toolkitu/bramy MCP niesie ten znacznik (2026-08-25,
    // rozkaz Króla „kradną tożsamości"). Sesje agentów wpinały klucz WŁAŚCICIELA i postowały na
    // kanałach z jego dymka (SOVEREIGN) — serwer nie miał JAK odróżnić bramy od aplikacji, bo
    // hub-key-exchange zwraca zwykły JWT usera. Ten nagłówek to rozróżnia: message-send odrzuca
    // post na kanał z tożsamości CZŁOWIEKA, gdy przyszedł przez bramę — z komunikatem każącym
    // wpiąć klucz SWOJEJ linii. Aplikacja mosadd.com nigdy nie wysyła tego nagłówka.
    global: {
      headers: {
        ...(env.userJwt ? { Authorization: `Bearer ${env.userJwt}` } : {}),
        "x-mosadd-origin": "hub-gateway",
        // Nagłówek tylko, gdy sesja MA tożsamość — puste "" (brama bez sessionKey) nie wysyła nic,
        // więc serwerowy strażnik 409 nie widzi fałszywych roszczeń.
        ...(sessionId() ? { "x-mosadd-session": sessionId() } : {}),
        // ⛔ KTÓRA TO SESJA (2026-08-27, „każdy generał co chwilę gubi mózg"). Wszyscy generałowie
        // wpinają się kluczem hub TEGO SAMEGO właściciela, więc dla serwera ich wywołania były
        // nieodróżnialne — a deklaracja linii (`comms_session_attach as_agent`) trzymała JEDEN
        // wiersz na konto. Skutek: kto wpiął się ostatni, odbierał linię wszystkim pozostałym, a
        // ich posty na kanałach zaczynały wracać z 403. Tożsamość sesji (stdio: per proces,
        // brama: per klucz API) pozwala dziewięciu liniom na jednym koncie nie deptać sobie po piętach.
      },
    },
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
    // supabase-js throws FunctionsHttpError for any non-2xx, whose `.message`
    // is the FIXED generic string "Edge Function returned a non-2xx status
    // code" — the *real* reason (e.g. {"error":"wrapped_group_key required"},
    // "forbidden", an RLS denial) lives in `error.context`, a Response. Read it
    // so the agent gets an actionable message (and the HTTP status) it can
    // reason about and self-correct on, instead of the same opaque sentence
    // for every failure across mDM/mIRC/mp0st/mRAG/prekey/message-list.
    let msg =
      error instanceof Error && error.message
        ? error.message
        : `Edge function ${fn} failed`;
    const ctx = (error as { context?: unknown }).context;
    if (ctx && typeof (ctx as Response).text === "function") {
      const res = ctx as Response;
      try {
        const raw = await res.text();
        if (raw) {
          let detail = raw;
          try {
            const parsed = JSON.parse(raw) as { error?: unknown; message?: unknown };
            detail =
              (typeof parsed.error === "string" && parsed.error) ||
              (typeof parsed.message === "string" && parsed.message) ||
              raw;
          } catch {
            // non-JSON body — use the raw text as-is
          }
          const status = typeof res.status === "number" ? res.status : undefined;
          msg = status ? `${fn} (${status}): ${detail}` : `${fn}: ${detail}`;
        }
      } catch {
        // body already consumed or unreadable — keep the generic message
      }
    }
    throw new Error(msg);
  }
  if (data == null) {
    throw new Error(`Edge function ${fn} returned no data`);
  }
  return data;
}
