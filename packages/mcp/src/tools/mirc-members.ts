/**
 * mIRC channel members — join, leave, invite, kick, ban, set-role, set-ptt.
 *
 * Wraps the mosadd backend's `channel-members-manage` Edge Function (audit ab6c885f),
 * which dispatches on the `action` body field.
 *
 * Split from packages/mcp/src/tools/mirc.ts because the channel-management
 * surface and the member-management surface have different ergonomics — a
 * model that handles roster ops shouldn't have to read past 5 'channel CRUD'
 * tools to find them.
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { invokeFunction, readSupabaseEnv } from "../providers/supabase.js";

// ---- Schemas ----

const ChannelId = z
  .string()
  .min(1)
  .max(120)
  .describe("Channel id (UUID). From mIRC_list / mIRC_create.");

const MemberIdentity = z
  .string()
  .min(1)
  .describe("Target user's identity id (UUID). From mDM_list_contacts or radar logs.");

const Role = z
  .enum(["superadmin", "admin", "moderator", "member"])
  .describe("Role to assign. owner = channel creator (not assignable); promote up to one tier below your own.");

const mIRC_join_input = z.object({
  channel_id: ChannelId,
  password: z.string().min(1).optional().describe("Pass only for access_mode=password channels. Private channels cannot be joined directly (403) — use mIRC_request_access."),
});

const mIRC_request_access_input = z.object({
  channel_id: ChannelId,
});

// ---- mIRC_invite ----
// Wraps channel-members-manage `invite`, which forks on WHO the target is:
//   · an agent/robot the CALLER OWNS → membership is written NOW — channel_members + the linked
//     space_members row (+ a channel_keys row when wrapped_group_key is given) — and the reply is
//     { auto_joined: true, member }. No code, nothing to redeem (LINEAR-5596: a code minted for
//     your own agent is a dead letter — it has no keyboard to paste it into);
//   · a human, or an agent owned by somebody ELSE → the reply is { invite: { code, … } }: an
//     invite code (kod zaproszenia) the recipient redeems in the app ("+ → I have an invite code").
// Why this tool is P0: mIRC_join adds the KEY's identity (the account — usually the human), while
// message-send signs channel posts with the AGENT. So every channel created from the toolkit was
// MUTE — its agent was never a member and each post 403'd agent_not_in_channel — until someone
// opened the app's member drawer. This is that drawer, callable.
const InviteRole = z
  .enum(["member", "moderator", "admin"])
  .describe("Role the invitee lands with (default member). Must be strictly below your own role — the EF applies the same tier rule as mIRC_set_role.");

const mIRC_invite_input = z.object({
  channel_id: ChannelId,
  identity_id: z
    .string()
    .min(1)
    .describe("Identity id (UUID) of who to add. Your own agents: mDM_list_my_agents → agents[].identity_id. People / other people's agents: mDM_list_contacts."),
  role: InviteRole.optional(),
  wrapped_group_key: z
    .string()
    .optional()
    .describe(
      "Required on password/private channels that hold a group key: the channel group key wrapped to the INVITEE's identity key (the same material mIRC_approve_request takes). Without it the EF refuses with 400 ('This channel is encrypted — unlock your vault…'). Open channels: omit.",
    ),
  ttl_seconds: z
    .number()
    .int()
    .min(300)
    .max(30 * 86400)
    .optional()
    .describe("Lifetime of an invite CODE (code path only; ignored when the target auto-joins). Default 7 days; the EF clamps to 5 min … 30 days."),
});

export type MircInviteInput = z.infer<typeof mIRC_invite_input>;

const mIRC_leave_input = z.object({
  channel_id: ChannelId,
});

// EF channel-members-manage reads `target_identity_id` (the normalizer below maps
// identity_id → target_identity_id). The old `request_id` field was ignored →
// 400 "target_identity_id required" on every approve/reject.
const mIRC_reject_request_input = z.object({
  channel_id: ChannelId,
  identity_id: z.string().min(1).describe("Identity id of the requester to reject (state=requested; from mIRC_list members)."),
});

const mIRC_approve_request_input = mIRC_reject_request_input.extend({
  wrapped_group_key: z
    .string()
    .optional()
    .describe(
      "Required to approve a join to a password/private (group-key) channel: the channel group key wrapped to the approved member's identity key. Without it the backend rejects the approval with a 'wrapped_group_key required' error. (Access requests only exist on non-open channels, so this is effectively always required.)",
    ),
});

const mIRC_kick_input = z.object({
  channel_id: ChannelId,
  identity_id: MemberIdentity,
  // NOTE: a `reason` field used to be advertised here but channel-members-manage
  // never persists it (no audit row on kick) — removed until the backend logs it
  // (see consistency ticket) so the tool doesn't claim an audit trail it can't deliver.
});

const mIRC_ban_input = z.object({
  channel_id: ChannelId,
  identity_id: MemberIdentity,
  // NOTE: `reason` (no storage) and `until` (timed ban) were removed — the EF ban
  // branch ignores both, so `until` produced a SILENT PERMANENT ban when a caller
  // asked for a temporary one. Ban is permanent-until-unban; enforced temp-bans +
  // ban audit are tracked in the consistency ticket.
});

const mIRC_unban_input = z.object({
  channel_id: ChannelId,
  identity_id: MemberIdentity,
});

const mIRC_set_role_input = z.object({
  channel_id: ChannelId,
  identity_id: MemberIdentity,
  role: Role,
});

const mIRC_set_ptt_input = z.object({
  channel_id: ChannelId,
  identity_id: MemberIdentity,
  ptt_enabled: z.boolean().describe("Allow this member to hold the PTT floor in voice mode."),
});

// ---- Handlers ----

async function invokeChannelMembers(
  action: string,
  body: Record<string, unknown>,
  ctx: MosaddToolContext,
): Promise<unknown> {
  // Map the toolkit's intuitive input field names to the exact ones the
  // channel-members-manage Edge Function reads. Without this, kick/ban/unban/
  // set-role/set-ptt all 400 ("target_identity_id required"), set-role is
  // ignored, and set-ptt silently disables PTT (missing can_ptt → false).
  const b: Record<string, unknown> = { ...body };
  if ("identity_id" in b) { b.target_identity_id = b.identity_id; delete b.identity_id; }
  // ⛔ PUŁAPKA role → new_role. set-role reads `new_role`, but the EF's `invite` branch reads
  // `body.role` (channel-members-manage: `const inviteRole = … body?.role …`). Renaming here would
  // silently drop the requested role — every invite would land as "member" with no error anywhere —
  // so for invite the field goes through under its own name.
  if ("role" in b && action !== "invite") { b.new_role = b.role; delete b.role; }
  if ("ptt_enabled" in b) { b.can_ptt = b.ptt_enabled; delete b.ptt_enabled; }
  readSupabaseEnv();
  ctx.log("debug", `mIRC.${action}`, b);
  return await invokeFunction("channel-members-manage", { action, ...b });
}

/** Reply of channel-members-manage `invite` — two branches, see the mIRC_invite note above. */
export type MircInviteResult =
  | { auto_joined: true; member: unknown }
  | { invite: { id: string; code: string; token_prefix: string; role: string; target_identity_id: string; expires_at: string } };

/**
 * ONE path to the EF, shared by mIRC_invite and mIRC_create's `invite_agents` fan-out — so the
 * field-name normalizer (and its invite exemption) cannot be bypassed by a second copy.
 */
export async function inviteToChannel(input: MircInviteInput, ctx: MosaddToolContext): Promise<MircInviteResult> {
  return (await invokeChannelMembers("invite", input as Record<string, unknown>, ctx)) as MircInviteResult;
}

// ---- Registration ----

export const mircMembersTools: MosaddTool[] = [
  {
    name: "mIRC_join",
    title: "Join channel",
    annotations: { readOnlyHint: false },
    requires: "network",
    description:
      "Join a channel as the current user. Pass `password` only for access_mode=password channels; private channels cannot be joined directly (403) — use mIRC_request_access + approval. Idempotent: an existing active member gets their membership row back (200, no 409).",
    inputSchema: mIRC_join_input,
    handler: ((input, ctx) => invokeChannelMembers("join", input as Record<string, unknown>, ctx)) as MosaddTool["handler"],
  },
  {
    // Własny agent/robot → auto_joined:true (channel_members + space_members + klucz grupy);
    // człowiek / cudzy agent → kod zaproszenia. Rozgałęzia SERWER (channel-members-manage), nie toolkit.
    name: "mIRC_invite",
    title: "Invite / add a member",
    annotations: { readOnlyHint: false },
    requires: "network",
    description:
      "Add someone to a channel you own or admin (owner/superadmin/admin; you cannot hand out a role equal to or above your own). TWO OUTCOMES, decided server-side by who the target is. (1) An agent or robot YOU OWN joins immediately — reply {auto_joined:true, member}: the backend writes channel_members AND the linked space_members row (both are required before its posts pass message-send) plus a channel_keys row when you pass wrapped_group_key. No code, nothing to redeem. THIS is the step that lets an agent speak in a channel: mIRC_join adds the KEY's identity (usually you, the human), while channel posts are signed by the AGENT — a channel created from the toolkit stays mute until its agent is added here (or via invite_agents on mIRC_create). (2) A human, or an agent owned by somebody else, gets an invite code — reply {invite:{code, expires_at, …}}; hand the code over and they redeem it in the app (+ → I have an invite code). A fresh code supersedes that person's earlier live codes; default lifetime 7 days (ttl_seconds). Refused: a banned identity (403), an existing active member (400), self-target (400). Rate limit: 20 invites/min per caller. Password/private channels that hold a group key need wrapped_group_key (wrapped to the invitee's identity key) — the toolkit does not derive group keys, so either supply it as with mIRC_approve_request, or add the member from the mosadd.com member drawer, which wraps it for you.",
    inputSchema: mIRC_invite_input,
    handler: ((input, ctx) => inviteToChannel(input as MircInviteInput, ctx)) as MosaddTool["handler"],
  },
  {
    name: "mIRC_request_access",
    title: "Request channel access",
    annotations: { readOnlyHint: false },
    requires: "network",
    description:
      "Request access to a password/private channel (your membership goes to state=requested for an admin to approve).",
    inputSchema: mIRC_request_access_input,
    handler: ((input, ctx) => invokeChannelMembers("request-access", input as Record<string, unknown>, ctx)) as MosaddTool["handler"],
  },
  {
    name: "mIRC_leave",
    title: "Leave channel",
    annotations: { readOnlyHint: false },
    requires: "network",
    description: "Leave a channel as the current user. Owner cannot leave without transferring ownership first.",
    inputSchema: mIRC_leave_input,
    handler: ((input, ctx) => invokeChannelMembers("leave", input as Record<string, unknown>, ctx)) as MosaddTool["handler"],
  },
  {
    name: "mIRC_approve_request",
    title: "Approve access request",
    annotations: { readOnlyHint: false },
    requires: "network",
    description:
      "Approve a pending access request (state=requested → active). Admins / moderators / owner only. Because access requests only exist on non-open (password/private) channels, you must pass wrapped_group_key — the channel group key wrapped to the approved member's identity key.",
    inputSchema: mIRC_approve_request_input,
    handler: ((input, ctx) => invokeChannelMembers("approve-request", input as Record<string, unknown>, ctx)) as MosaddTool["handler"],
  },
  {
    name: "mIRC_reject_request",
    title: "Reject access request",
    annotations: { readOnlyHint: false },
    requires: "network",
    description: "Reject a pending access request. Admins / moderators / owner only.",
    inputSchema: mIRC_reject_request_input,
    handler: ((input, ctx) => invokeChannelMembers("reject-request", input as Record<string, unknown>, ctx)) as MosaddTool["handler"],
  },
  {
    name: "mIRC_kick",
    title: "Kick a member",
    annotations: { destructiveHint: true },
    requires: "network",
    description:
      "Remove a member from the channel. They can rejoin if not banned. Requires moderator+.",
    inputSchema: mIRC_kick_input,
    handler: ((input, ctx) => invokeChannelMembers("kick", input as Record<string, unknown>, ctx)) as MosaddTool["handler"],
  },
  {
    name: "mIRC_ban",
    title: "Ban a member",
    annotations: { destructiveHint: true },
    requires: "network",
    description:
      "Ban a member from the channel. The ban is permanent until you call mIRC_unban. Requires admin+.",
    inputSchema: mIRC_ban_input,
    handler: ((input, ctx) => invokeChannelMembers("ban", input as Record<string, unknown>, ctx)) as MosaddTool["handler"],
  },
  {
    name: "mIRC_unban",
    title: "Lift a ban",
    annotations: { readOnlyHint: false },
    requires: "network",
    description: "Lift a ban. Requires admin+.",
    inputSchema: mIRC_unban_input,
    handler: ((input, ctx) => invokeChannelMembers("unban", input as Record<string, unknown>, ctx)) as MosaddTool["handler"],
  },
  {
    name: "mIRC_set_role",
    title: "Set member role",
    annotations: { readOnlyHint: false },
    requires: "network",
    description:
      "Promote / demote a member. Roles: owner(100) > superadmin(90) > admin(80) > moderator(70) > member(10). No 'guest'. An actor may assign any role below their own tier — so a superadmin (not only the owner) can promote to admin.",
    inputSchema: mIRC_set_role_input,
    handler: ((input, ctx) => invokeChannelMembers("set-role", input as Record<string, unknown>, ctx)) as MosaddTool["handler"],
  },
  {
    name: "mIRC_set_ptt",
    title: "Set push-to-talk permission",
    annotations: { readOnlyHint: false },
    requires: "network",
    description:
      "Grant or revoke PTT floor permission for a member in voice-capable channels (capabilities.ptt=true). Requires moderator+.",
    inputSchema: mIRC_set_ptt_input,
    handler: ((input, ctx) => invokeChannelMembers("set-ptt", input as Record<string, unknown>, ctx)) as MosaddTool["handler"],
  },
];
