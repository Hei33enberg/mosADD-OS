/**
 * mIRC channel members — join, leave, kick, ban, set-role, set-ptt.
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
  password: z.string().min(1).optional().describe("Required if the channel is access_mode=private."),
});

const mIRC_request_access_input = z.object({
  channel_id: ChannelId,
  message: z.string().max(500).optional().describe("Optional note for the channel owner explaining why."),
});

const mIRC_leave_input = z.object({
  channel_id: ChannelId,
});

const mIRC_approve_request_input = z.object({
  channel_id: ChannelId,
  request_id: z.string().min(1).describe("Pending request id."),
});

const mIRC_reject_request_input = mIRC_approve_request_input;

const mIRC_kick_input = z.object({
  channel_id: ChannelId,
  identity_id: MemberIdentity,
  reason: z.string().max(500).optional(),
});

const mIRC_ban_input = z.object({
  channel_id: ChannelId,
  identity_id: MemberIdentity,
  reason: z.string().max(500).optional(),
  /** Optional unban deadline (ISO-8601). Omit for permanent ban. */
  until: z.string().optional(),
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
  if ("role" in b) { b.new_role = b.role; delete b.role; }
  if ("ptt_enabled" in b) { b.can_ptt = b.ptt_enabled; delete b.ptt_enabled; }
  readSupabaseEnv();
  ctx.log("debug", `mIRC.${action}`, b);
  return await invokeFunction("channel-members-manage", { action, ...b });
}

// ---- Registration ----

export const mircMembersTools: MosaddTool[] = [
  {
    name: "mIRC_join",
    requires: "network",
    description:
      "Join a channel as the current user. For private channels pass `password`. Returns a membership row or 409 if already a member.",
    inputSchema: mIRC_join_input,
    handler: ((input, ctx) => invokeChannelMembers("join", input as Record<string, unknown>, ctx)) as MosaddTool["handler"],
  },
  {
    name: "mIRC_request_access",
    requires: "network",
    description:
      "Request access to an invite_only channel. Owner / admins get a notification with the optional message.",
    inputSchema: mIRC_request_access_input,
    handler: ((input, ctx) => invokeChannelMembers("request-access", input as Record<string, unknown>, ctx)) as MosaddTool["handler"],
  },
  {
    name: "mIRC_leave",
    requires: "network",
    description: "Leave a channel as the current user. Owner cannot leave without transferring ownership first.",
    inputSchema: mIRC_leave_input,
    handler: ((input, ctx) => invokeChannelMembers("leave", input as Record<string, unknown>, ctx)) as MosaddTool["handler"],
  },
  {
    name: "mIRC_approve_request",
    requires: "network",
    description: "Approve a pending access request. Admins / moderators / owner only.",
    inputSchema: mIRC_approve_request_input,
    handler: ((input, ctx) => invokeChannelMembers("approve-request", input as Record<string, unknown>, ctx)) as MosaddTool["handler"],
  },
  {
    name: "mIRC_reject_request",
    requires: "network",
    description: "Reject a pending access request. Admins / moderators / owner only.",
    inputSchema: mIRC_reject_request_input,
    handler: ((input, ctx) => invokeChannelMembers("reject-request", input as Record<string, unknown>, ctx)) as MosaddTool["handler"],
  },
  {
    name: "mIRC_kick",
    requires: "network",
    description:
      "Remove a member from the channel. They can rejoin if not banned. Requires moderator+. `reason` is logged to channel-event-log.",
    inputSchema: mIRC_kick_input,
    handler: ((input, ctx) => invokeChannelMembers("kick", input as Record<string, unknown>, ctx)) as MosaddTool["handler"],
  },
  {
    name: "mIRC_ban",
    requires: "network",
    description:
      "Ban a member from the channel. They cannot rejoin until unbanned. `until` (ISO-8601) for time-bound ban; omit for permanent. Requires admin+.",
    inputSchema: mIRC_ban_input,
    handler: ((input, ctx) => invokeChannelMembers("ban", input as Record<string, unknown>, ctx)) as MosaddTool["handler"],
  },
  {
    name: "mIRC_unban",
    requires: "network",
    description: "Lift a ban. Requires admin+.",
    inputSchema: mIRC_unban_input,
    handler: ((input, ctx) => invokeChannelMembers("unban", input as Record<string, unknown>, ctx)) as MosaddTool["handler"],
  },
  {
    name: "mIRC_set_role",
    requires: "network",
    description:
      "Promote / demote a member. Roles: owner > admin > moderator > member > guest. Only owner can promote to admin; only admin+ can promote to moderator.",
    inputSchema: mIRC_set_role_input,
    handler: ((input, ctx) => invokeChannelMembers("set-role", input as Record<string, unknown>, ctx)) as MosaddTool["handler"],
  },
  {
    name: "mIRC_set_ptt",
    requires: "network",
    description:
      "Grant or revoke PTT floor permission for a member in voice-capable channels (capabilities.ptt=true). Requires moderator+.",
    inputSchema: mIRC_set_ptt_input,
    handler: ((input, ctx) => invokeChannelMembers("set-ptt", input as Record<string, unknown>, ctx)) as MosaddTool["handler"],
  },
];
