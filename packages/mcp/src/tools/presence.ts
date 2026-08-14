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
 * Security: the write is plain RLS, no privileged path. The policy on agent_bridge_heartbeat is
 * `identity_id IN (SELECT id FROM identities WHERE user_id = auth.uid())` for ALL commands
 * (verified on prod), so a session can only ever claim the account whose key it holds.
 */

import { hostname } from "node:os";
import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { getSupabase, readSupabaseEnv, type SupabaseEnv } from "../providers/supabase.js";

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

interface Attachment {
  timer: ReturnType<typeof setInterval>;
  env: SupabaseEnv;
}

/** identity_id → its keep-alive. Keyed per identity so one gateway process can hold many. */
const attachments = new Map<string, Attachment>();

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
async function resolveSelf(env: SupabaseEnv): Promise<{ id: string; display_name: string | null }> {
  const sb = getSupabase(env);
  const { data: u, error: ue } = await sb.auth.getUser();
  if (ue || !u?.user) {
    throw new Error(
      "Unable to resolve the current account. Set MOSADD_API_KEY (hub key) or MOSADD_USER_JWT, or run `mosadd login`.",
    );
  }
  const { data, error } = await sb
    .from("identities")
    .select("id, display_name")
    .eq("user_id", u.user.id)
    .maybeSingle();
  if (error || !data) {
    throw new Error("This account has no mosadd identity row yet — sign in to mosadd.com once to create it.");
  }
  return { id: data.id as string, display_name: (data.display_name as string | null) ?? null };
}

const comms_session_attach_input = z.object({
  label: z
    .string()
    .max(120)
    .optional()
    .describe(
      "Short name for THIS session, shown to the owner as who is holding the line (e.g. 'CTO — Claude Code', 'dispatcher — Cowork'). Defaults to the machine name.",
    ),
  release: z
    .boolean()
    .optional()
    .describe(
      "Hand the line back immediately instead of claiming it: stops this session's keep-alive and clears the liveness row, so the 24/7 cloud stand-in resumes answering at once rather than after the hold expires. Call this when the session is finishing.",
    ),
});

interface AttachResult {
  attached: boolean;
  identity_id: string;
  display_name: string | null;
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

  // Whether attaching or releasing, any previous keep-alive for this identity is stale: a second
  // attach replaces the first rather than doubling the beat rate.
  const existing = attachments.get(self.id);
  if (existing) {
    clearInterval(existing.timer);
    attachments.delete(self.id);
  }

  if (input.release) {
    ctx.log("info", "comms_session_attach: releasing line", { identity_id: self.id });
    // DELETE, not a backdated timestamp. "No row" is the truthful representation of "nobody is on
    // this line"; writing a fake past `last_seen_at` would put a lie in a table other code reads.
    const { error } = await getSupabase(env).from("agent_bridge_heartbeat").delete().eq("identity_id", self.id);
    if (error) throw new Error(`Could not release the line: ${error.message}`);
    return {
      attached: false,
      identity_id: self.id,
      display_name: self.display_name,
      note: "Line released. The 24/7 cloud stand-in answers this account from now on.",
    };
  }

  const host = input.label?.trim() || `mcp:${hostname()}`;
  const mode = "mcp-session";

  // First beat is awaited so the caller learns immediately if RLS refuses (wrong account / no
  // identity) instead of failing silently in a timer nobody watches.
  try {
    await beat(env, self.id, host, mode);
  } catch (e) {
    throw new Error(`Could not claim the line: ${e instanceof Error ? e.message : String(e)}`);
  }

  const timer = setInterval(() => {
    void beat(env, self.id, host, mode).catch((e) => {
      // A single missed beat is survivable (3 min of cover remain) and must not kill the interval:
      // a transient network blip would otherwise silently un-attach the session for good.
      ctx.log("warn", "comms_session_attach: beat failed", { identity_id: self.id, error: String(e) });
    });
  }, BEAT_MS);
  // Never hold the process open on account of the beat — when the session ends, it ends.
  timer.unref?.();
  attachments.set(self.id, { timer, env });

  ctx.log("info", "comms_session_attach: line claimed", { identity_id: self.id, host });
  return {
    attached: true,
    identity_id: self.id,
    display_name: self.display_name,
    host,
    holds_for_seconds: HOLD_SECONDS,
    note:
      "This session now owns the account's reply lane; the cloud stand-in will not answer while it is held. " +
      "The hold renews itself for as long as this process runs and lapses on its own if the session dies. " +
      "Call again with release:true to hand it back immediately.",
  };
}

export const presenceTools: MosaddTool[] = [
  {
    name: "comms_session_attach",
    requires: "network",
    description:
      "Claim this mosADD account's reply lane for the CURRENT agent session, so the 24/7 cloud stand-in stops answering in your place and the owner talks to you instead. Call it once at the start of a session that will answer the owner's messages; the hold renews itself while the session runs and lapses on its own if the session dies, so the account is never left looking alive when nobody is there. Pass release:true when finishing to hand the line back immediately. Owner-scoped: a session can only claim the account whose key it holds.",
    inputSchema: comms_session_attach_input,
    handler: comms_session_attach as MosaddTool["handler"],
  },
];

/** Test-only: stop every keep-alive so a suite does not leak timers between cases. */
export function __clearAttachmentsForTest(): void {
  for (const a of attachments.values()) clearInterval(a.timer);
  attachments.clear();
}
