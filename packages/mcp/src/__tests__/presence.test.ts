/**
 * comms_session_attach — the liveness contract.
 *
 * This tool decides WHO answers the owner: a live agent session, or the 24/7 cloud stand-in.
 * Both answering, or the stand-in answering in a live session's name, is the exact failure that
 * cost the founder his trust in the agent (see the file header in tools/presence.ts). So the
 * things pinned here are the ones that would silently re-open it:
 *
 *   1. attaching writes the liveness row the stand-in reads, under the CALLER'S identity;
 *   2. the hold renews itself on a timer — the model is not asked to remember a clock;
 *   3. the timer is unref()ed, so a held line can never keep a dead session's process alive;
 *   4. re-attaching replaces the beat instead of stacking a second one;
 *   5. release DELETES the row (no backdated timestamp lying in a table other code reads).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const IDENTITY_ID = "b228b6ae-dda6-4823-9882-40ea91ed1530";
const USER_ID = "b1b6c60a-f5c5-47bd-8772-9e4e387994ad";
const AGENT_ID = "0489d4c6-8727-442f-bf83-68747a469492";

/** Calls recorded by the fake Supabase client, so assertions read like the wire traffic. */
const calls = {
  upserts: [] as Record<string, unknown>[],
  deletes: [] as string[],
};

/**
 * Minimal query-builder stand-in: every method returns the builder, `maybeSingle()` resolves the
 * identity row, and the builder is thenable so `await delete().eq()` works like PostgREST's.
 */
function makeBuilder(table: string) {
  const builder: Record<string, unknown> = {};
  let pendingDelete = false;
  const self = () => builder;
  Object.assign(builder, {
    select: self,
    is: self,
    or: self,
    upsert: (row: Record<string, unknown>) => {
      calls.upserts.push({ table, ...row });
      return Promise.resolve({ error: null });
    },
    delete: () => {
      pendingDelete = true;
      return builder;
    },
    eq: (_col: string, val: string) => {
      if (pendingDelete) {
        calls.deletes.push(val);
        return Promise.resolve({ error: null });
      }
      return builder;
    },
    // resolveOwnedAgentLine path: .or(...).limit(2) → the caller's ONE owned agent.
    limit: () =>
      Promise.resolve({
        data: [{ id: AGENT_ID, m0ssad_email: "dispatcher@mosadd.com", display_name: "DYSPOZYTOR" }],
        error: null,
      }),
    maybeSingle: () => Promise.resolve({ data: { id: IDENTITY_ID, display_name: "mosADD CTO" }, error: null }),
  });
  return builder;
}

vi.mock("../providers/supabase.js", () => ({
  readSupabaseEnv: () => ({ url: "https://example.supabase.co", anonKey: "anon", userJwt: "jwt" }),
  getSupabase: () => ({
    auth: { getUser: () => Promise.resolve({ data: { user: { id: USER_ID } }, error: null }) },
    from: (table: string) => makeBuilder(table),
  }),
}));

const ctx = { log: () => {} } as never;

/** Import after the mock is registered, so the module under test picks it up. */
const { presenceTools, __clearAttachmentsForTest } = await import("../tools/presence.js");
const attach = presenceTools[0];

async function call(input: Record<string, unknown>) {
  return (await attach.handler(input, ctx)) as Record<string, unknown>;
}

describe("comms_session_attach", () => {
  beforeEach(() => {
    calls.upserts = [];
    calls.deletes = [];
    vi.useFakeTimers();
  });
  afterEach(() => {
    __clearAttachmentsForTest();
    vi.useRealTimers();
  });

  it("is registered as a network tool under the comms_ capability group", () => {
    expect(attach.name).toBe("comms_session_attach");
    expect(attach.requires).toBe("network");
  });

  it("claims the line for the CALLER'S identity, with a label the owner can read", async () => {
    const out = await call({ label: "CTO — Claude Code" });
    expect(out.attached).toBe(true);
    expect(out.identity_id).toBe(IDENTITY_ID);
    expect(calls.upserts).toHaveLength(1);
    expect(calls.upserts[0]).toMatchObject({
      table: "agent_bridge_heartbeat",
      identity_id: IDENTITY_ID,
      host: "CTO — Claude Code",
      mode: "mcp-session",
    });
  });

  it("renews the hold on its own — the model is never asked to keep time", async () => {
    await call({});
    expect(calls.upserts).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(calls.upserts).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(calls.upserts).toHaveLength(3);
    // Every beat is a fresh timestamp, not a replay of the first one.
    expect(calls.upserts[2].last_seen_at).not.toBe(calls.upserts[0].last_seen_at);
  });

  it("never keeps a finished session's process alive (timer is unref'ed)", async () => {
    const unref = vi.fn();
    const spy = vi.spyOn(globalThis, "setInterval").mockReturnValue({ unref } as never);
    await call({});
    expect(unref).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("re-attaching replaces the beat instead of stacking a second one", async () => {
    await call({ label: "first" });
    await call({ label: "second" });
    calls.upserts = [];
    await vi.advanceTimersByTimeAsync(60_000);
    expect(calls.upserts).toHaveLength(1);
    expect(calls.upserts[0].host).toBe("second");
  });

  it("release DELETES the row and stops beating — the stand-in resumes at once", async () => {
    await call({});
    const out = await call({ release: true });
    expect(out.attached).toBe(false);
    // Two deletes since 2026-08-26: the heartbeat row (by identity) AND the as_agent
    // declaration in mosadd_gateway_agent_binding (by user) — a finishing session hands
    // back EVERYTHING it could hold, so no stale declaration keeps signing later posts.
    expect(calls.deletes).toEqual([IDENTITY_ID, USER_ID]);
    calls.upserts = [];
    await vi.advanceTimersByTimeAsync(180_000);
    expect(calls.upserts).toHaveLength(0);
  });

  it("as_agent declares the line: binding upsert + beat on the AGENT's identity, not the key's", async () => {
    const out = await call({ as_agent: "dispatcher@mosadd.com", label: "dispatcher — Cowork" });
    expect(out.attached).toBe(true);
    expect(out.identity_id).toBe(AGENT_ID);
    expect((out.speaking_as as { address: string }).address).toBe("dispatcher@mosadd.com");
    // The signing declaration message-send reads (migration 20260826210000)…
    expect(calls.upserts).toContainEqual(
      expect.objectContaining({
        table: "mosadd_gateway_agent_binding",
        user_id: USER_ID,
        agent_identity_id: AGENT_ID,
      }),
    );
    // …and the AGENT's liveness row, so ITS cloud stand-in defers to this session.
    expect(calls.upserts).toContainEqual(
      expect.objectContaining({
        table: "agent_bridge_heartbeat",
        identity_id: AGENT_ID,
        host: "dispatcher — Cowork",
      }),
    );
    // The key's own line is NOT claimed — attaching as an agent must not silence the owner's lane.
    expect(calls.upserts.some((u) => u.table === "agent_bridge_heartbeat" && u.identity_id === IDENTITY_ID)).toBe(false);
  });
});
