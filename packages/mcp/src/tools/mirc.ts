/**
 * mIRC — Persistent Channels.
 *
 * IRC-style persistent channels (Discord/Slack semantics). Channels live forever
 * until deleted, members come and go. Distinct from mROOM (ephemeral, no-account).
 *
 * Phase 1 alpha: wired to m0ssad-3 `channel-manage` Edge Function (strangler-fig).
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
    ptt: z.boolean().default(false),
    live: z.boolean().default(false),
  })
  .describe("Which modes are enabled in this channel: txt (text), ptt (push-to-talk voice), live (live stream).")
  .optional();

const mIRC_create_input = z.object({
  name: z.string().min(1).max(80).describe("Channel display name."),
  topic: z.string().max(500).optional().describe("Optional channel topic/description."),
  access_mode: AccessMode.default("open"),
  password: z.string().min(6).max(120).optional().describe("Password (only for access_mode=password)."),
  capabilities: Capabilities,
});

const mIRC_list_input = z.object({
  limit: z.number().int().min(1).max(500).default(100).optional(),
  offset: z.number().int().min(0).default(0).optional(),
  access_mode: AccessMode.optional().describe("Filter to a single access mode."),
});

const mIRC_get_input = z.object({
  channel_id: ChannelId,
});

const mIRC_update_input = z.object({
  channel_id: ChannelId,
  name: z.string().min(1).max(80).optional(),
  topic: z.string().max(500).optional(),
  access_mode: AccessMode.optional(),
  capabilities: Capabilities,
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
  return await invokeFunction<{ channel: unknown }>("channel-manage", {
    action: "create",
    ...input,
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
  return await invokeFunction<{ channel: unknown }>("channel-manage", {
    action: "update",
    ...input,
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

// ---- Registration ----

export const mircTools: MosaddTool[] = [
  {
    name: "mIRC_create",
    requires: "network",
    description:
      "Create a new persistent channel (Discord/Slack-style). Set access_mode to open (anyone joins), password (shared-password gated), or private (invite-only). capabilities controls modes (txt/ptt/live).",
    inputSchema: mIRC_create_input,
    handler: mIRC_create as MosaddTool["handler"],
  },
  {
    name: "mIRC_list",
    requires: "network",
    description:
      "List channels available to the current user. Optionally filter by access_mode.",
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
    description: "Update channel metadata (name, topic, access_mode, capabilities). Owner only.",
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
];
