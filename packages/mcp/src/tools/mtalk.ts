/**
 * mTALK — Push-to-Talk (the kill feature).
 *
 * Half-duplex voice over a real-time room, with a walkie-talkie floor
 * discipline: one transmitter at a time, others queue, and an anti-hog timeout
 * keeps the floor moving. An AGENT uses these tools to: spin up a PTT room, get
 * join credentials for a human/bot client, and drive the floor (press/release
 * PTT, see who's transmitting). The audio itself flows over the media transport
 * the VoiceProvider points at (LiveKit by default); these tools coordinate WHO
 * may transmit, which is the part that makes a PTT channel work.
 *
 * Transport-agnostic: the same tools drive an off-grid radio host, where the
 * floor is the physical RF channel (the host injects its own VoiceProvider).
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";

const RoomLabel = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9._-]+$/)
  .describe("Human-readable room label (e.g. 'ops', 'field-team'). Used to derive a stable room id.");

const RoomId = z.string().min(1).describe("Room id returned by mTALK_open.");

const mTALK_open_input = z.object({
  label: RoomLabel.optional().describe("Optional label; defaults to a personal room."),
});
const mTALK_join_input = z.object({ room_id: RoomId });
const mTALK_press_input = z.object({ room_id: RoomId });
const mTALK_release_input = z.object({ room_id: RoomId });
const mTALK_state_input = z.object({ room_id: RoomId });

async function mTALK_open(
  input: z.infer<typeof mTALK_open_input>,
  ctx: MosaddToolContext,
): Promise<{ room_id: string }> {
  const { roomId } = await ctx.providers.voice.createRoom(input.label);
  ctx.log("debug", "mTALK_open", { room_id: roomId });
  return { room_id: roomId };
}

async function mTALK_join(
  input: z.infer<typeof mTALK_join_input>,
  ctx: MosaddToolContext,
): Promise<{ room_id: string; token: string; url: string; identity: string }> {
  const ticket = await ctx.providers.voice.joinTicket(input.room_id);
  ctx.log("debug", "mTALK_join", { room_id: ticket.roomId, identity: ticket.identity });
  return { room_id: ticket.roomId, token: ticket.token, url: ticket.url, identity: ticket.identity };
}

async function mTALK_press(
  input: z.infer<typeof mTALK_press_input>,
  ctx: MosaddToolContext,
): Promise<{ granted: boolean; position: number; holder: string | null; queue: string[] }> {
  const res = await ctx.providers.voice.requestFloor(input.room_id);
  ctx.log("debug", "mTALK_press", { room_id: input.room_id, granted: res.granted, position: res.position });
  return { granted: res.granted, position: res.position, holder: res.snapshot.holder, queue: res.snapshot.queue };
}

async function mTALK_release(
  input: z.infer<typeof mTALK_release_input>,
  ctx: MosaddToolContext,
): Promise<{ holder: string | null; queue: string[] }> {
  const snap = await ctx.providers.voice.releaseFloor(input.room_id);
  ctx.log("debug", "mTALK_release", { room_id: input.room_id, holder: snap.holder });
  return { holder: snap.holder, queue: snap.queue };
}

async function mTALK_state(
  input: z.infer<typeof mTALK_state_input>,
  ctx: MosaddToolContext,
): Promise<{ holder: string | null; since: string | null; queue: string[] }> {
  const snap = await ctx.providers.voice.floorState(input.room_id);
  return { holder: snap.holder, since: snap.since, queue: snap.queue };
}

export const mtalkTools: MosaddTool[] = [
  {
    name: "mTALK_open",
    requires: "any",
    description:
      "Open (or get) a push-to-talk room. Returns a stable room_id. Pass an optional label to share a named room (e.g. 'ops'); omit it for a personal room. Works over network (LiveKit) or off-grid radio depending on the host.",
    inputSchema: mTALK_open_input,
    handler: mTALK_open as MosaddTool["handler"],
  },
  {
    name: "mTALK_join",
    requires: "network",
    description:
      "Get credentials (token + media URL) to join a PTT room's audio transport. Hand these to a human or bot client to connect. The agent itself drives the floor with mTALK_press / mTALK_release.",
    inputSchema: mTALK_join_input,
    handler: mTALK_join as MosaddTool["handler"],
  },
  {
    name: "mTALK_press",
    requires: "any",
    description:
      "Press push-to-talk: request the floor in a room. Half-duplex — if no one is transmitting you are GRANTED the floor (granted=true) and may speak; otherwise you are queued FIFO and `position` tells you where you are. Call mTALK_release when done. A holder who never releases is auto-bumped after the anti-hog timeout.",
    inputSchema: mTALK_press_input,
    handler: mTALK_press as MosaddTool["handler"],
  },
  {
    name: "mTALK_release",
    requires: "any",
    description:
      "Release push-to-talk: give up the floor (or cancel your queued request). If you held the floor, the next participant in the queue is promoted automatically. Returns the new holder and queue.",
    inputSchema: mTALK_release_input,
    handler: mTALK_release as MosaddTool["handler"],
  },
  {
    name: "mTALK_state",
    requires: "any",
    description:
      "Read a PTT room's floor state without changing it: who is currently transmitting (holder), since when, and the waiting queue.",
    inputSchema: mTALK_state_input,
    handler: mTALK_state as MosaddTool["handler"],
  },
];
