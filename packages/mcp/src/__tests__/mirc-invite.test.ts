/**
 * mIRC_invite — the wrapper that lets a channel created from the toolkit STOP being mute.
 *
 * mIRC_join adds the KEY's identity (the account, usually a human) to a channel, while
 * message-send signs channel posts with the AGENT — so until the agent itself is a member
 * every post 403s `agent_not_in_channel`. channel-members-manage `invite` has done the right
 * thing since LINEAR-5596 (own agent → auto_joined, no code); the toolkit just never exposed it.
 *
 * Pinned here, because each would silently regress:
 *   1. the tool exists, is a network tool, and its description names BOTH outcomes;
 *   2. the field-name normalizer does NOT rename `role` → `new_role` for invite — the EF's
 *      invite branch reads `body.role`, so the rename would drop every requested role to
 *      "member" without an error (set-role keeps the rename: that branch reads `new_role`);
 *   3. mIRC_create's `invite_agents` fan-out never forwards the field to channel-manage,
 *      reports per-agent failures in `invites[]`, and never throws the created channel away.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MosaddTool } from "../types.js";

const CHANNEL_ID = "6d0f1c1e-1111-4a2b-9c3d-000000000001";
const AGENT_A = "0489d4c6-8727-442f-bf83-68747a469492";
const AGENT_B = "b228b6ae-dda6-4823-9882-40ea91ed1530";

const calls: { fn: string; body: Record<string, unknown> }[] = [];
let inviteReply: (body: Record<string, unknown>) => unknown = () => ({ auto_joined: true, member: {} });

vi.mock("../providers/supabase.js", () => ({
  readSupabaseEnv: () => ({ url: "https://example.supabase.co", anonKey: "anon", userJwt: "jwt" }),
  invokeFunction: async (fn: string, body: Record<string, unknown>) => {
    calls.push({ fn, body });
    if (fn === "channel-manage") return { channel: { id: CHANNEL_ID, name: body.name } };
    if (fn === "channel-members-manage") return inviteReply(body);
    throw new Error(`unexpected edge function ${fn}`);
  },
}));

const ctx = { log: () => {} } as never;
/** Import after the mock is registered, so the modules under test pick it up. */
const { mircMembersTools } = await import("../tools/mirc-members.js");
const { mircTools } = await import("../tools/mirc.js");

function tool(list: readonly MosaddTool[], name: string): MosaddTool {
  const t = list.find((x) => x.name === name);
  if (!t) throw new Error(`${name} is not registered`);
  return t;
}

describe("mIRC_invite", () => {
  beforeEach(() => {
    calls.length = 0;
    inviteReply = () => ({ auto_joined: true, member: {} });
  });

  it("is registered as a network tool whose description names both outcomes", () => {
    const invite = tool(mircMembersTools, "mIRC_invite");
    expect(invite.requires).toBe("network");
    expect(invite.description).toContain("auto_joined");
    expect(invite.description).toContain("invite code");
  });

  it("sends `role` under its own name — the EF's invite branch reads body.role, not new_role", async () => {
    const invite = tool(mircMembersTools, "mIRC_invite");
    await invite.handler({ channel_id: CHANNEL_ID, identity_id: AGENT_A, role: "moderator" }, ctx);
    expect(calls).toHaveLength(1);
    expect(calls[0].fn).toBe("channel-members-manage");
    expect(calls[0].body).toMatchObject({ action: "invite", channel_id: CHANNEL_ID, target_identity_id: AGENT_A, role: "moderator" });
    expect(calls[0].body).not.toHaveProperty("new_role");
    expect(calls[0].body).not.toHaveProperty("identity_id");
  });

  it("keeps the role → new_role rename for set-role (the exemption is invite-only)", async () => {
    const setRole = tool(mircMembersTools, "mIRC_set_role");
    await setRole.handler({ channel_id: CHANNEL_ID, identity_id: AGENT_A, role: "admin" }, ctx);
    expect(calls[0].body).toMatchObject({ action: "set-role", new_role: "admin" });
    expect(calls[0].body).not.toHaveProperty("role");
  });
});

describe("mIRC_create invite_agents fan-out", () => {
  beforeEach(() => {
    calls.length = 0;
    inviteReply = () => ({ auto_joined: true, member: {} });
  });

  it("creates first, then invites each agent; a per-agent failure lands in invites[] and never undoes the channel", async () => {
    inviteReply = (body) => {
      if (body.target_identity_id === AGENT_B) throw new Error("channel-members-manage (400): Already a member of this channel");
      return { auto_joined: true, member: { identity_id: body.target_identity_id } };
    };
    const create = tool(mircTools, "mIRC_create");
    const out = (await create.handler({ name: "ops", access_mode: "open", invite_agents: [AGENT_A, AGENT_B] }, ctx)) as {
      channel: { id: string };
      invites: Array<{ identity_id: string; ok: boolean; auto_joined?: boolean; error?: string }>;
    };
    expect(out.channel.id).toBe(CHANNEL_ID);
    expect(calls.map((c) => c.fn)).toEqual(["channel-manage", "channel-members-manage", "channel-members-manage"]);
    // invite_agents is toolkit-side composition — channel-manage must never see it.
    expect(calls[0].body).not.toHaveProperty("invite_agents");
    expect(calls[1].body).toMatchObject({ action: "invite", channel_id: CHANNEL_ID, target_identity_id: AGENT_A });
    expect(out.invites).toHaveLength(2);
    expect(out.invites[0]).toMatchObject({ identity_id: AGENT_A, ok: true, auto_joined: true });
    expect(out.invites[1]).toMatchObject({ identity_id: AGENT_B, ok: false });
    expect(out.invites[1].error).toContain("Already a member");
  });

  it("without invite_agents behaves exactly as before — one call, no invites key", async () => {
    const create = tool(mircTools, "mIRC_create");
    const out = (await create.handler({ name: "ops", access_mode: "open" }, ctx)) as Record<string, unknown>;
    expect(calls).toHaveLength(1);
    expect(out).not.toHaveProperty("invites");
  });
});
