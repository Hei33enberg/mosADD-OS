/**
 * mIRC — Persistent Channels.
 *
 * IRC-style persistent channels (Discord/Slack semantics). Channels live forever
 * until deleted, members come and go. Ephemeral / no-account / single-action
 * channels are PRESETS of mIRC (planned: LINEAR-3523 — TTL `expires_at` +
 * guest-link + voice), not a separate module. The killed mROOM is absorbed here.
 *
 * Phase 1 alpha: wired to the mosadd backend's `channel-manage` Edge Function (strangler-fig).
 * The single edge fn dispatches on `action` — we expose each action as its own
 * MCP tool for clarity.
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { invokeFunction, readSupabaseEnv } from "../providers/supabase.js";

// ---- Schemas ----

const ChannelId = z
  .string()
  .min(1)
  .max(120)
  .describe("Channel id (UUID). Use mIRC_list to discover available channels.");

const AccessMode = z
  .enum(["open", "password", "private"])
  .describe("open: anyone can join · password: join with a shared password · private: invite-only.");

const Capabilities = z
  .object({
    txt: z.boolean().default(true),
    voice: z.boolean().default(false),
    files: z.boolean().default(false),
    ptt: z.boolean().default(false),
    live: z.boolean().default(false),
  })
  .describe("Which modes are enabled: txt (text), voice (group voice), files (file attach), ptt (push-to-talk), live (live stream). Voice/PTT/live are server-relayed via LiveKit — NOT end-to-end encrypted.")
  .optional();

const mIRC_create_input = z.object({
  name: z.string().min(1).max(80).describe("Channel display name."),
  topic: z.string().max(500).optional().describe("Optional channel topic/description."),
  access_mode: AccessMode.default("open"),
  password: z.string().min(6).max(120).optional().describe("Password (only for access_mode=password)."),
  capabilities: Capabilities,
  discoverable: z
    .boolean()
    .optional()
    .describe("List this channel in the PUBLIC directory (mIRC_discover). Honoured ONLY for access_mode=open; ignored for password/private."),
  wrapped_group_key: z
    .string()
    .optional()
    .describe(
      "Required for access_mode=password|private (these are E2EE channels): the channel's group key wrapped to the creator's identity key. Open channels ignore it. If omitted on a non-open channel the backend rejects the call with a 'wrapped_group_key required' error.",
    ),
});

const mIRC_list_input = z.object({
  limit: z.number().int().min(1).max(500).default(100).optional(),
  offset: z.number().int().min(0).default(0).optional(),
  // NOTE: an access_mode filter was removed — channel-manage's list branch doesn't
  // filter by it (it was a silent no-op). Filter client-side on the returned
  // access_mode field. Server-side filtering is tracked in the consistency ticket.
});

const mIRC_get_input = z.object({
  channel_id: ChannelId,
});

const mIRC_update_input = z.object({
  channel_id: ChannelId,
  name: z.string().min(1).max(80).optional(),
  topic: z.string().max(500).optional(),
  // NOTE: access_mode was removed — channel-manage's update branch ignores it, and
  // switching an existing channel to/from an E2EE (password/private) mode needs
  // group-key handling that isn't wired yet. Recreate the channel to change mode.
  capabilities: Capabilities,
  discoverable: z.boolean().optional().describe("Toggle public-directory listing (open channels only)."),
});

const mIRC_discover_input = z.object({
  q: z.string().max(100).optional().describe("Optional channel-name filter."),
  limit: z.number().int().min(1).max(500).default(50).optional(),
  offset: z.number().int().min(0).default(0).optional(),
});

const mIRC_report_input = z.object({
  channel_id: ChannelId,
  reason: z.enum(["spam", "abuse", "harassment", "illegal", "other"]).describe("Report reason."),
  detail: z.string().max(1000).optional().describe("Optional free-text context."),
});

const mIRC_delete_input = z.object({
  channel_id: ChannelId,
});

// ---- Handlers ----

async function mIRC_create(
  input: z.infer<typeof mIRC_create_input>,
  ctx: MosaddToolContext,
): Promise<{ channel: unknown }> {
  readSupabaseEnv();
  ctx.log("debug", "mIRC_create invoking channel-manage", { name: input.name });
  // channel-manage reads `description`, not `topic` — map it so the channel
  // topic isn't silently dropped on create (the update handler does the same).
  const { topic, ...rest } = input as typeof input & { topic?: string };
  const payload = topic !== undefined ? { ...rest, description: topic } : { ...rest };
  return await invokeFunction<{ channel: unknown }>("channel-manage", {
    action: "create",
    ...payload,
  });
}

async function mIRC_list(
  input: z.infer<typeof mIRC_list_input>,
  ctx: MosaddToolContext,
): Promise<{ channels: unknown[] }> {
  readSupabaseEnv();
  ctx.log("debug", "mIRC_list invoking channel-manage");
  return await invokeFunction<{ channels: unknown[] }>("channel-manage", {
    action: "list",
    ...input,
  });
}

async function mIRC_get(
  input: z.infer<typeof mIRC_get_input>,
  ctx: MosaddToolContext,
): Promise<{ channel: unknown }> {
  readSupabaseEnv();
  ctx.log("debug", "mIRC_get invoking channel-manage", { channel_id: input.channel_id });
  return await invokeFunction<{ channel: unknown }>("channel-manage", {
    action: "get",
    channel_id: input.channel_id,
  });
}

async function mIRC_update(
  input: z.infer<typeof mIRC_update_input>,
  ctx: MosaddToolContext,
): Promise<{ channel: unknown }> {
  readSupabaseEnv();
  ctx.log("debug", "mIRC_update invoking channel-manage", { channel_id: input.channel_id });
  // channel-manage reads `description`, not `topic` — map it so topic edits aren't
  // silently dropped.
  const { topic, ...rest } = input as typeof input & { topic?: string };
  const payload = topic !== undefined ? { ...rest, description: topic } : { ...rest };
  return await invokeFunction<{ channel: unknown }>("channel-manage", {
    action: "update",
    ...payload,
  });
}

async function mIRC_delete(
  input: z.infer<typeof mIRC_delete_input>,
  ctx: MosaddToolContext,
): Promise<{ deleted: true }> {
  readSupabaseEnv();
  ctx.log("debug", "mIRC_delete invoking channel-manage", { channel_id: input.channel_id });
  await invokeFunction<{ deleted: boolean }>("channel-manage", {
    action: "delete",
    channel_id: input.channel_id,
  });
  return { deleted: true };
}

async function mIRC_discover(
  input: z.infer<typeof mIRC_discover_input>,
  ctx: MosaddToolContext,
): Promise<{ channels: unknown[] }> {
  readSupabaseEnv();
  ctx.log("debug", "mIRC_discover invoking channel-manage");
  return await invokeFunction<{ channels: unknown[] }>("channel-manage", {
    action: "discover",
    ...input,
  });
}

async function mIRC_report(
  input: z.infer<typeof mIRC_report_input>,
  ctx: MosaddToolContext,
): Promise<{ ok: boolean }> {
  readSupabaseEnv();
  ctx.log("debug", "mIRC_report invoking report-content", { channel_id: input.channel_id });
  return await invokeFunction<{ ok: boolean }>("report-content", {
    thread_id: `channel:${input.channel_id}`,
    reason: input.reason,
    detail: input.detail,
  });
}

// ---- Registration ----

export const mircTools: MosaddTool[] = [
  {
    name: "mIRC_create",
    requires: "network",
    description:
      "Create a new persistent channel (Discord/Slack-style). Set access_mode to open (anyone joins), password (shared-password gated), or private (invite-only). capabilities controls modes (txt/voice/files/ptt/live; voice/ptt/live are server-relayed via LiveKit, NOT E2EE). Set discoverable:true (open channels only) to list it in the public directory. NOTE: password and private channels have end-to-end encrypted TEXT — supply wrapped_group_key (the group key wrapped to your identity key); open channels do not need it. Channel voice is never E2EE.",
    inputSchema: mIRC_create_input,
    handler: mIRC_create as MosaddTool["handler"],
  },
  {
    name: "mIRC_list",
    requires: "network",
    description:
      "List channels available to the current user.",
    inputSchema: mIRC_list_input,
    handler: mIRC_list as MosaddTool["handler"],
  },
  {
    name: "mIRC_get",
    requires: "network",
    description: "Get full details of a single channel by id.",
    inputSchema: mIRC_get_input,
    handler: mIRC_get as MosaddTool["handler"],
  },
  {
    name: "mIRC_update",
    requires: "network",
    description: "Update channel metadata (name, topic, capabilities). Owner only. Access mode is fixed at creation — recreate the channel to change it.",
    inputSchema: mIRC_update_input,
    handler: mIRC_update as MosaddTool["handler"],
  },
  {
    name: "mIRC_delete",
    requires: "network",
    description: "Delete a channel and cascade-remove its members. Owner only.",
    inputSchema: mIRC_delete_input,
    handler: mIRC_delete as MosaddTool["handler"],
  },
  {
    name: "mIRC_discover",
    requires: "network",
    description:
      "Browse the PUBLIC channel DIRECTORY — open channels whose owners opted in (discoverable=true). Returns {id, channel_key, name, description, capabilities, member_count, is_member}. Filter by name with q; paginated. Join a result with mIRC_join (open = one-click). Private/password/partner channels never appear.",
    inputSchema: mIRC_discover_input,
    handler: mIRC_discover as MosaddTool["handler"],
  },
  {
    name: "mIRC_report",
    requires: "network",
    description:
      "Report a channel for abuse (spam/harassment/illegal/etc). Metadata + reason only — never message content. The reported party is the channel owner (server-derived). Use for public-directory moderation.",
    inputSchema: mIRC_report_input,
    handler: mIRC_report as MosaddTool["handler"],
  },
];
