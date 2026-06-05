/**
 * mROOM — Ephemeral rooms with no-account join links.
 *
 * USP: anyone can join via a short-lived link without signing up. Distinct from
 * mIRC (persistent channels for known users). Use cases: customer support drop-in
 * call, live-stream after-party, anonymous tipline, incident bridge.
 *
 * Phase 1 alpha: wired to the mosadd backend's `privroom-manage` + `privroom-guest-token`
 * Edge Functions.
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { invokeFunction, readSupabaseEnv } from "../providers/supabase.js";

// ---- Schemas ----

const RoomId = z.string().min(1).describe("Private room id (UUID).");

const mROOM_voice_join_input = z.object({
  room_id: RoomId,
  video: z.boolean().optional().describe("Request video instead of audio-only. Default false."),
});

const mROOM_create_input = z.object({
  ttl_seconds: z
    .number()
    .int()
    .min(60)
    .max(86_400 * 30)
    .default(86_400)
    .optional()
    .describe("Time-to-live in seconds. Defaults to 24 h. Max 30 days."),
});

const mROOM_join_input = z.object({
  room_id: RoomId,
});

const mROOM_close_input = z.object({
  room_id: RoomId,
});

const mROOM_leave_input = z.object({
  room_id: RoomId,
});

const mROOM_list_input = z.object({});

const mROOM_create_guest_link_input = z.object({
  room_id: RoomId,
  display_name: z
    .string()
    .min(1)
    .max(80)
    .describe("Display name the guest will appear under. They never sign up — this is the only identifier."),
  ttl_seconds: z
    .number()
    .int()
    .min(60)
    .max(86_400 * 7)
    .default(3600)
    .optional()
    .describe("How long the guest token is valid. Default 1 h, max 7 days."),
});

// ---- Handlers ----

async function mROOM_create(
  input: z.infer<typeof mROOM_create_input>,
  ctx: MosaddToolContext,
): Promise<{ room: unknown }> {
  readSupabaseEnv();
  const expires_at = new Date(Date.now() + (input.ttl_seconds ?? 86_400) * 1000).toISOString();
  ctx.log("debug", "mROOM_create invoking privroom-manage", { expires_at });
  return await invokeFunction<{ room: unknown }>("privroom-manage", {
    action: "create",
    expires_at,
  });
}

async function mROOM_join(
  input: z.infer<typeof mROOM_join_input>,
  ctx: MosaddToolContext,
): Promise<{ joined: true; room_id: string }> {
  readSupabaseEnv();
  ctx.log("debug", "mROOM_join invoking privroom-manage", { room_id: input.room_id });
  return await invokeFunction<{ joined: true; room_id: string }>("privroom-manage", {
    action: "join",
    room_id: input.room_id,
  });
}

async function mROOM_close(
  input: z.infer<typeof mROOM_close_input>,
  ctx: MosaddToolContext,
): Promise<{ closed: true; room_id: string }> {
  readSupabaseEnv();
  ctx.log("debug", "mROOM_close invoking privroom-manage", { room_id: input.room_id });
  return await invokeFunction<{ closed: true; room_id: string }>("privroom-manage", {
    action: "close",
    room_id: input.room_id,
  });
}

async function mROOM_leave(
  input: z.infer<typeof mROOM_leave_input>,
  ctx: MosaddToolContext,
): Promise<{ left: true; room_id: string }> {
  readSupabaseEnv();
  ctx.log("debug", "mROOM_leave invoking privroom-manage", { room_id: input.room_id });
  return await invokeFunction<{ left: true; room_id: string }>("privroom-manage", {
    action: "leave",
    room_id: input.room_id,
  });
}

async function mROOM_list(
  _input: z.infer<typeof mROOM_list_input>,
  ctx: MosaddToolContext,
): Promise<{ rooms: unknown[] }> {
  readSupabaseEnv();
  ctx.log("debug", "mROOM_list invoking privroom-manage");
  return await invokeFunction<{ rooms: unknown[] }>("privroom-manage", { action: "list" });
}

async function mROOM_create_guest_link(
  input: z.infer<typeof mROOM_create_guest_link_input>,
  ctx: MosaddToolContext,
): Promise<{ token: string; join_url: string; expires_at: string }> {
  readSupabaseEnv();
  ctx.log("debug", "mROOM_create_guest_link invoking privroom-guest-token", {
    room_id: input.room_id,
  });
  const result = await invokeFunction<{ token: string; expires_at: string }>("privroom-guest-token", {
    room_id: input.room_id,
    display_name: input.display_name,
    ttl_seconds: input.ttl_seconds ?? 3600,
  });
  return {
    token: result.token,
    join_url: `https://mosadd.com/r/${input.room_id}?t=${result.token}`,
    expires_at: result.expires_at,
  };
}

async function mROOM_voice_join(
  input: z.infer<typeof mROOM_voice_join_input>,
  ctx: MosaddToolContext,
): Promise<{ room_id: string; token: string; url: string; identity: string; mode: "audio" | "video" }> {
  // Full-duplex GROUP voice in an mROOM. Audio rides the VoiceProvider's media
  // transport (LiveKit by default) — same minting path as mTALK/mDM voice, but
  // no floor control (everyone can talk). Join the membership first via
  // mROOM_join (or a guest link) so you're authorized in the room.
  const ticket = await ctx.providers.voice.joinTicket(input.room_id);
  ctx.log("debug", "mROOM_voice_join", { room_id: ticket.roomId, identity: ticket.identity });
  return {
    room_id: ticket.roomId,
    token: ticket.token,
    url: ticket.url,
    identity: ticket.identity,
    mode: input.video ? "video" : "audio",
  };
}

// ---- Registration ----

export const mroomTools: MosaddTool[] = [
  {
    name: "mROOM_create",
    requires: "network",
    description:
      "Create an ephemeral private room. Auto-joins the creator. Defaults to 24 h TTL — pass ttl_seconds to override.",
    inputSchema: mROOM_create_input,
    handler: mROOM_create as MosaddTool["handler"],
  },
  {
    name: "mROOM_create_guest_link",
    requires: "network",
    description:
      "USP: Generate a short-lived join link that lets a person enter the room WITHOUT a mosadd account. Returns { token, join_url, expires_at }. Share the join_url out-of-band (email, SMS, QR). Use case: support call, live-stream after-party, anonymous tipline.",
    inputSchema: mROOM_create_guest_link_input,
    handler: mROOM_create_guest_link as MosaddTool["handler"],
  },
  {
    name: "mROOM_join",
    requires: "network",
    description: "Join an existing private room (current user, not a guest).",
    inputSchema: mROOM_join_input,
    handler: mROOM_join as MosaddTool["handler"],
  },
  {
    name: "mROOM_leave",
    requires: "network",
    description: "Leave a private room.",
    inputSchema: mROOM_leave_input,
    handler: mROOM_leave as MosaddTool["handler"],
  },
  {
    name: "mROOM_close",
    requires: "network",
    description: "Close a private room and remove all members. Founder only.",
    inputSchema: mROOM_close_input,
    handler: mROOM_close as MosaddTool["handler"],
  },
  {
    name: "mROOM_list",
    requires: "network",
    description: "List private rooms the current user belongs to.",
    inputSchema: mROOM_list_input,
    handler: mROOM_list as MosaddTool["handler"],
  },
  {
    name: "mROOM_voice_join",
    requires: "network",
    description:
      "Join an mROOM's full-duplex GROUP voice (everyone can talk — no walkie-talkie floor; that's mTALK). Returns media credentials (token + url) for the room's audio/video transport. Be a room member first (mROOM_join or a guest link). Set video:true for video.",
    inputSchema: mROOM_voice_join_input,
    handler: mROOM_voice_join as MosaddTool["handler"],
  },
];
