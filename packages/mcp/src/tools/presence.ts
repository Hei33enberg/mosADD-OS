/**
 * comms_session_attach — a LIVE agent session claims the account's reply lane.
 *
 * WHY THIS EXISTS (measured 2026-08-14). mosADD answers a DM in one of two ways: a real agent
 * session (a Claude Code / Cowork / Desktop session holding this MCP server) or a cloud stand-in
 * (`agent-dm-responder`, pg_cron, small model). They must never both answer, and the stand-in must
 * never speak in the session's name — the founder caught exactly that twice, and stopped trusting
 * the agent afterwards.
 *
 * The arbitration already existed: `agent_bridge_heartbeat`. A fresh row = "somebody real is on
 * this line", and the cron stands down. But the ONLY thing that could write that row was a bespoke
 * script on the founder's own PC (`mosadd-agent/bridge-claude.mjs`). So "a real Claude answers you"
 * meant "the founder keeps a window open on one machine" — and that machine went quiet on
 * 2026-08-05 while the account kept looking alive. Four of his five agent contacts had nobody home.
 *
 * This tool moves the beat into the MCP server itself, so ANY session anywhere — his laptop, a
 * VPS, the legal dispatcher, a cloud runner — attaches with one call and the stand-in defers to it
 * for as long as that session's process lives.
 *
 * ⭐ AS_AGENT (2026-08-26, founder order: "wpinanie agentów ma działać co sesję i w różnych
 * kontach Claude"). Fleet sessions usually hold the OWNER's key (identity kind=human), so a bare
 * attach claims the OWNER's lane — and every channel post they made either landed in the owner's
 * bubble (identity theft) or, after the v146 guard, got a 403 unless the model remembered a
 * per-post `agent` field. `as_agent` fixes this at the ROOT: the session declares ONCE whose line
 * it speaks for. That does two things server-side:
 *   1. upserts `mosadd_gateway_agent_binding` — message-send then signs the session's channel
 *      posts as that agent automatically (explicit `agent` field still wins; ownership is
 *      re-validated server-side on every post);
 *   2. beats the AGENT line's heartbeat (RLS additionally allows the owner to claim lines of
 *      agents they own — migration 20260826210000), so the agent's cloud stand-in defers to
 *      this session, exactly as if the agent's own key were plugged in.
 * Binding is per OWNER (one row) — the last attach wins, which is visible and recoverable,
 * unlike a silent mis-signed post.
 *
 * ⭐ THE BEAT IS NOT THE MODEL'S JOB. The heartbeat window is minutes wide, and a model cannot be
 * relied on to call a tool on a timer — it answers prompts, it does not hold a clock. So attaching
 * starts an internal keep-alive interval inside THIS process. The signal is therefore "the session
 * process is alive", not "the model remembered", which is the honest thing to measure: when the
 * session dies (limit, crash, closed window) the beats stop with it and the cloud takes over on
 * its own. The timer is `unref()`ed so it can never keep a process alive that would otherwise exit.
 *
 * ⚠ MULTI-TENANCY. The hosted HTTP gateway serves many users from one process and resolves each
 * caller's session into an AsyncLocalStorage store (see providers/supabase.ts). A background timer
 * fires OUTSIDE that store, so it must not call `readSupabaseEnv()` later — it would read another
 * tenant's env or throw. The env is captured at attach time and passed explicitly to
 * `getSupabase(env)` on every beat, and attachments are tracked per identity, not per process.
 *
 * Security: the write is plain RLS, no privileged path. agent_bridge_heartbeat allows a session
 * to claim the account whose key it holds OR a line of an agent that account OWNS (kind='agent',
 * retired IS NULL); mosadd_gateway_agent_binding enforces the same ownership in its CHECK. A key
 * can never claim or speak for a stranger's line.
 */

import { hostname } from "node:os";
import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { getSupabase, readSupabaseEnv, sessionId, type SupabaseEnv } from "../providers/supabase.js";

/**
 * How often we re-stamp the row. The consumer (`agent-dm-responder`, BRIDGE_FRESH_MS) trusts a beat
 * for 5 minutes; beating every 60s means two consecutive failures still leave three minutes of
 * cover. Do not raise this above ~2 min without raising the window on that side first — the
 * founder has already lived through the failure where the beat aged out MID-ANSWER and the cloud
 * posted a competing reply next to the real one.
 */
const BEAT_MS = 60_000;

/** Advertised to the caller so it knows how long an attachment survives without this process. */
const HOLD_SECONDS = 300;

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

interface Attachment {
  timer: ReturnType<typeof setInterval>;
  env: SupabaseEnv;
}

/** identity_id → its keep-alive. Keyed per identity so one gateway process can hold many. */
const attachments = new Map<string, Attachment>();

/**
 * owner user_id → agent identity this PROCESS bound via as_agent. Needed so a plain
 * `release:true` from the same session also hands back the agent line it took, without
 * a releasing session ever touching a binding some OTHER process created.
 */
const processBindings = new Map<string, string>();

/** One upsert of the liveness row. Best-effort by design: a missed beat must never throw into a timer. */
async function beat(env: SupabaseEnv, identityId: string, host: string, mode: string): Promise<void> {
  await getSupabase(env)
    .from("agent_bridge_heartbeat")
    .upsert(
      { identity_id: identityId, last_seen_at: new Date().toISOString(), host, mode },
      { onConflict: "identity_id" },
    );
}

/**
 * Resolve the identity row behind the current credentials.
 *
 * Same shape as mdm.ts's resolveSelfIdentityId — kept local rather than exported/shared because
 * that one is private to mDM and this file must not reach into another module's internals.
 * The identity id is NOT the auth user id; the heartbeat table is keyed on the identity.
 */
async function resolveSelf(
  env: SupabaseEnv,
): Promise<{ id: string; display_name: string | null; user_id: string; kind: string | null }> {
  const sb = getSupabase(env);
  const { data: u, error: ue } = await sb.auth.getUser();
  if (ue || !u?.user) {
    throw new Error(
      "Unable to resolve the current account. Set MOSADD_API_KEY (hub key) or MOSADD_USER_JWT, or run `mosadd login`.",
    );
  }
  const { data, error } = await sb
    .from("identities")
    .select("id, display_name, kind")
    .eq("user_id", u.user.id)
    .maybeSingle();
  if (error || !data) {
    throw new Error("This account has no mosadd identity row yet — sign in to mosadd.com once to create it.");
  }
  return {
    id: data.id as string,
    display_name: (data.display_name as string | null) ?? null,
    user_id: u.user.id,
    kind: (data.kind as string | null) ?? null,
  };
}

/**
 * Resolve ONE agent OWNED by the caller from what they typed: identity uuid, mosADD address
 * (dispatcher@mosadd.com) or display name. Mirrors the server-side ownership rule
 * (m0ssad-3 `_shared/ownedAgent.ts`): kind='agent' AND owner_user_id = caller AND not retired.
 * Ownership is part of the QUERY — a stranger's agent resolves to nothing, never to a row we
 * would then have to remember to reject.
 */
async function resolveOwnedAgentLine(
  env: SupabaseEnv,
  ownerUserId: string,
  ref: string,
): Promise<{ id: string; m0ssad_email: string | null; display_name: string | null } | null> {
  const value = ref.trim();
  if (!value || /[(),]/.test(value)) return null;
  let q = getSupabase(env)
    .from("identities")
    .select("id, m0ssad_email, display_name")
    .eq("kind", "agent")
    .eq("owner_user_id", ownerUserId)
    .is("retired_at", null);
  q = UUID_RE.test(value)
    ? q.or(`id.eq.${value},m0ssad_email.eq.${value}`)
    : q.or(`m0ssad_email.eq.${value},display_name.eq.${value}`);
  const { data, error } = await q.limit(2);
  if (error || !data || data.length !== 1) return null;
  return data[0] as { id: string; m0ssad_email: string | null; display_name: string | null };
}

function stopAttachment(identityId: string): void {
  const existing = attachments.get(identityId);
  if (existing) {
    clearInterval(existing.timer);
    attachments.delete(identityId);
  }
}

function startAttachment(env: SupabaseEnv, identityId: string, host: string, mode: string, ctx: MosaddToolContext): void {
  const timer = setInterval(() => {
    void beat(env, identityId, host, mode).catch((e) => {
      // A single missed beat is survivable (3 min of cover remain) and must not kill the interval:
      // a transient network blip would otherwise silently un-attach the session for good.
      ctx.log("warn", "comms_session_attach: beat failed", { identity_id: identityId, error: String(e) });
    });
  }, BEAT_MS);
  // Never hold the process open on account of the beat — when the session ends, it ends.
  timer.unref?.();
  attachments.set(identityId, { timer, env });
}

const comms_session_attach_input = z.object({
  label: z
    .string()
    .max(120)
    .optional()
    .describe(
      "Short name for THIS session, shown to the owner as who is holding the line (e.g. 'CTO — Claude Code', 'dispatcher — Cowork'). Defaults to the machine name.",
    ),
  as_agent: z
    .string()
    .max(200)
    .optional()
    .describe(
      "Speak as ONE OF THE OWNER'S AGENT LINES while holding the owner's key — its mosADD address (dispatcher@mosadd.com), identity id, or display name. Declares ONCE per session whose line this session speaks for: the gateway then signs your CHANNEL posts as that agent automatically (no per-post `agent` field needed), and that agent's cloud stand-in defers to you. The server verifies you OWN the agent; a stranger's agent is refused. Omit to claim the key's own line, exactly as before.",
    ),
  release: z
    .boolean()
    .optional()
    .describe(
      "Hand the line back immediately instead of claiming it: stops this session's keep-alive, clears the liveness row (and any as_agent declaration this session made), so the 24/7 cloud stand-in resumes answering at once rather than after the hold expires. Call this when the session is finishing.",
    ),
});

interface AttachResult {
  attached: boolean;
  identity_id: string;
  display_name: string | null;
  /** Set when as_agent bound this session to an agent line — whose voice channel posts use. */
  speaking_as?: { identity_id: string; address: string | null; display_name: string | null };
  /** Where the beat says it is coming from — the owner sees this. */
  host?: string;
  /** Seconds a beat stays trusted if this process stops beating. */
  holds_for_seconds?: number;
  note: string;
}

async function comms_session_attach(
  input: z.infer<typeof comms_session_attach_input>,
  ctx: MosaddToolContext,
): Promise<AttachResult> {
  // Capture the caller's session ONCE, here, inside the request context — see the multi-tenancy
  // note in the file header. Everything after this (including timer callbacks) uses this value.
  const env = readSupabaseEnv();
  const self = await resolveSelf(env);
  const sb = getSupabase(env);

  if (input.release) {
    // Hand back everything THIS process (or this call, via as_agent) holds for the account:
    // the key's own line, plus the agent line it declared with as_agent, plus that binding row.
    // DELETE, not a backdated timestamp. "No row" is the truthful representation of "nobody is
    // on this line"; writing a fake past `last_seen_at` would put a lie in a table other code reads.
    const toRelease = new Set<string>([self.id]);
    const bound = processBindings.get(self.user_id);
    if (bound) toRelease.add(bound);
    if (input.as_agent) {
      const agent = await resolveOwnedAgentLine(env, self.user_id, input.as_agent);
      if (agent) toRelease.add(agent.id);
    }
    for (const id of toRelease) {
      stopAttachment(id);
      const { error } = await sb.from("agent_bridge_heartbeat").delete().eq("identity_id", id);
      if (error) throw new Error(`Could not release the line: ${error.message}`);
    }
    // Zwalniamy WYŁĄCZNIE deklarację TEJ sesji — kasowanie po samym koncie zabierało linię
    // wszystkim pozostałym generałom wpiętym tym samym kluczem.
    await sb.from("mosadd_gateway_agent_binding").delete()
      .eq("user_id", self.user_id).eq("session_id", sessionId());
    processBindings.delete(self.user_id);
    ctx.log("info", "comms_session_attach: released", { identity_ids: [...toRelease] });
    return {
      attached: false,
      identity_id: self.id,
      display_name: self.display_name,
      note: "Line released (agent declaration cleared too). The 24/7 cloud stand-in answers from now on.",
    };
  }

  const host = input.label?.trim() || `mcp:${hostname()}`;
  const mode = "mcp-session";

  // Which line does this session claim? Without as_agent: the key's own line — bit-for-bit the
  // old behaviour. With as_agent: the OWNED agent's line + the gateway signing declaration.
  let lineId = self.id;
  let speakingAs: AttachResult["speaking_as"];
  if (input.as_agent) {
    const agent = await resolveOwnedAgentLine(env, self.user_id, input.as_agent);
    if (!agent) {
      throw new Error(
        `No LIVE agent of yours matches "${input.as_agent}". You may only speak as an agent you OWN ` +
          "(its mosADD address, identity id, or display name) — never as someone else's agent or another human.",
      );
    }
    lineId = agent.id;
    speakingAs = { identity_id: agent.id, address: agent.m0ssad_email, display_name: agent.display_name };

    // The signing declaration message-send reads (migration 20260826210000). RLS re-checks
    // ownership in its WITH CHECK; message-send re-validates AGAIN per post (defence in depth).
    const { error: bindError } = await sb.from("mosadd_gateway_agent_binding").upsert(
      {
        user_id: self.user_id,
        // ⛔ DEKLARACJA NALEŻY DO SESJI, NIE DO KONTA (2026-08-27). Wszyscy generałowie wpinają się
        // kluczem tego samego właściciela, więc klucz na samym `user_id` znaczył „kto ostatni, ten
        // zabiera linię wszystkim" — i realnie zabierał: Dyspozytor tracił prawo głosu na kanałach
        // w chwili, gdy wpinał się kolejny generał, a jego posty wracały z 403.
        session_id: sessionId(),
        agent_identity_id: agent.id,
        agent_address: agent.m0ssad_email,
        bound_at: new Date().toISOString(),
        bound_by_host: host,
      },
      { onConflict: "user_id,session_id" },
    );
    if (bindError) throw new Error(`Could not declare the agent line: ${bindError.message}`);
    processBindings.set(self.user_id, agent.id);
  }

  // Whether attaching or re-attaching, any previous keep-alive for this line is stale: a second
  // attach replaces the first rather than doubling the beat rate.
  stopAttachment(lineId);

  // First beat is awaited so the caller learns immediately if RLS refuses (wrong account / no
  // identity) instead of failing silently in a timer nobody watches.
  try {
    await beat(env, lineId, host, mode);
  } catch (e) {
    throw new Error(`Could not claim the line: ${e instanceof Error ? e.message : String(e)}`);
  }
  startAttachment(env, lineId, host, mode, ctx);

  ctx.log("info", "comms_session_attach: line claimed", { identity_id: lineId, host, as_agent: speakingAs?.address });
  return {
    attached: true,
    identity_id: lineId,
    display_name: speakingAs ? speakingAs.display_name : self.display_name,
    ...(speakingAs ? { speaking_as: speakingAs } : {}),
    host,
    holds_for_seconds: HOLD_SECONDS,
    note: speakingAs
      ? `This session now speaks for ${speakingAs.address ?? speakingAs.identity_id}: channel posts sent ` +
        "through this gateway are signed as that agent automatically (an explicit `agent` field still wins), " +
        "and the agent's cloud stand-in defers to you while the session runs. " +
        "Call again with release:true to hand it back."
      : "This session now owns the account's reply lane; the cloud stand-in will not answer while it is held. " +
        "The hold renews itself for as long as this process runs and lapses on its own if the session dies. " +
        "Call again with release:true to hand it back immediately.",
  };
}

export const presenceTools: MosaddTool[] = [
  {
    name: "comms_session_attach",
    title: "Attach session to a line",
    annotations: { destructiveHint: false, idempotentHint: true },
    requires: "network",
    description:
      "Claim a mosADD reply lane for the CURRENT agent session, so the 24/7 cloud stand-in stops answering in its place and the owner talks to you instead. Call it once at the start of a session; the hold renews itself while the session runs and lapses on its own if the session dies. Holding the OWNER's key while working as one of their agent lines? Pass as_agent:'<address of YOUR line>' (e.g. dispatcher@mosadd.com) — the gateway then signs your channel posts as that agent automatically for the whole session and silences that agent's stand-in; ownership is verified server-side. Pass release:true when finishing to hand everything back immediately. Owner-scoped: a session can only claim the account whose key it holds, or a line of an agent that account owns.",
    inputSchema: comms_session_attach_input,
    handler: comms_session_attach as MosaddTool["handler"],
  },
];

/**
 * AUTO-PAROWANIE (2026-08-26, rozkaz Króla po tygodniu „żywa sesja Dyspozytora nie jest
 * podpięta"): the founder kept talking to cloud stand-ins because LIVE sessions never
 * remembered to call comms_session_attach. A model cannot be relied on to remember a
 * handshake — so the handshake stops being the model's job: the server calls THIS after
 * every successful tool call. Any session that is actually DOING something on an agent
 * line thereby holds that line, and the stand-in defers, with zero cooperation from the
 * model.
 *
 * Which line gets the beat:
 *   · key's identity kind='agent'  → its own line (the dispatcher's own key working = paired);
 *   · kind='human' WITH an as_agent declaration (processBindings, i.e. made by THIS
 *     process) → the declared agent's line;
 *   · kind='human' without a declaration → NOTHING. Guessing which of the owner's nine
 *     lines a session speaks for would be a new identity bug, and auto-claiming the
 *     OWNER's line would silence his own stand-in every time any tool runs.
 *
 * Throttled to one DB write per identity per BEAT_MS; failures are swallowed — presence
 * is best-effort and must never break the tool call it rides on. Fire-and-forget by the
 * caller (void), so it adds zero latency to the tool's own response.
 */
const lastAutoBeat = new Map<string, number>();
const lastBindingCheck = new Map<string, number>();
export async function autoBeatFromActivity(ctx: MosaddToolContext): Promise<void> {
  try {
    const env = readSupabaseEnv();
    const self = await resolveSelf(env);
    let lineId: string | null = null;
    if (self.kind === "agent") {
      lineId = self.id;
    } else if (processBindings.has(self.user_id)) {
      lineId = processBindings.get(self.user_id)!;
    } else {
      // Hosted gateway is serverless: a declaration made in ANOTHER invocation lives only in
      // the DB. One throttled read per user per BEAT_MS keeps the cost of that honest.
      const now = Date.now();
      if (now - (lastBindingCheck.get(self.user_id) ?? 0) >= BEAT_MS) {
        lastBindingCheck.set(self.user_id, now);
        // ⛔ ZAWĘŻONE DO TEJ SESJI. Po 2026-08-27 na jedno konto przypada tyle wierszy, ilu
        // generałów jest wpiętych — zapytanie o sam `user_id` z `maybeSingle()` nie tylko
        // zwróciłoby BŁĄD przy dwóch sesjach, ale przy jednej trafiłoby w CUDZĄ deklarację i
        // biło pulsem w nie swoją linię.
        const { data } = await getSupabase(env)
          .from("mosadd_gateway_agent_binding")
          .select("agent_identity_id, bound_at")
          .eq("user_id", self.user_id)
          .eq("session_id", sessionId())
          .maybeSingle();
        if (data && Date.now() - new Date(data.bound_at as string).getTime() <= 24 * 60 * 60 * 1000) {
          lineId = data.agent_identity_id as string;
          processBindings.set(self.user_id, lineId);
        }
      }
    }
    if (!lineId) return;
    const now = Date.now();
    const last = lastAutoBeat.get(lineId) ?? 0;
    if (now - last < BEAT_MS) return;
    lastAutoBeat.set(lineId, now);
    await beat(env, lineId, `mcp:auto (${hostname()})`, "mcp-activity");
  } catch (e) {
    ctx.log("debug", "autoBeatFromActivity skipped", { error: String(e) });
  }
}

/** Test-only: stop every keep-alive so a suite does not leak timers between cases. */
export function __clearAttachmentsForTest(): void {
  for (const a of attachments.values()) clearInterval(a.timer);
  attachments.clear();
  processBindings.clear();
  lastAutoBeat.clear();
}
