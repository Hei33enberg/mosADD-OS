/**
 * mDM — 1:1 voice (full-duplex call + voice note).
 *
 * mDM is the PRIVATE channel: 1:1 / threaded text (mdm.ts) PLUS real-time 1:1
 * voice here. This is the ordinary phone-style call between two people — NOT
 * walkie-talkie (that's mTALK, half-duplex floor control) and NOT the telephone
 * network (that's mCALL / PSTN). Audio rides the same media transport the
 * VoiceProvider points at (LiveKit by default); these tools coordinate the room
 * and the call invite/hangup signalling over the DM channel.
 *
 * Flow:
 *   caller: mDM_call_start({ to })  → creates a room, returns join creds, AND
 *           drops a `call_invite` control message in the DM thread.
 *   callee: sees the invite (mDM_list), then mDM_call_answer({ room_id }) → creds.
 *   either: mDM_call_end({ room_id, to }) → drops a `call_end` control message.
 *
 * No new backend: rooms + tokens come from ctx.providers.voice (same minting
 * path mTALK uses); signalling reuses ctx.providers.dm.send.
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";

const PROTOCOL_VERSION = "mosadd.chat.v1";

const ContactRef = z
  .string()
  .min(1)
  .describe("Recipient identity id (UUID). Use mDM_list_contacts to find it.");

const RoomId = z.string().min(1).describe("Voice room id (from mDM_call_start's call_invite).");

const mDM_call_start_input = z.object({
  to: ContactRef,
  video: z.boolean().optional().describe("Request a video call instead of audio-only. Default false."),
  thread_label: z
    .string()
    .max(120)
    .regex(/^[a-zA-Z0-9._-]+$/)
    .optional()
    .describe("Optional thread label to place the call invite in. Defaults to the contact's main thread."),
});

const mDM_call_answer_input = z.object({ room_id: RoomId });

const mDM_call_end_input = z.object({
  room_id: RoomId,
  to: ContactRef.optional().describe("If set, also drop a call_end control message in this contact's DM thread."),
  thread_label: z.string().max(120).regex(/^[a-zA-Z0-9._-]+$/).optional(),
});

const mDM_voice_note_input = z.object({
  to: ContactRef,
  audio_url: z.string().url().describe("URL of the recorded audio clip (already uploaded by the client)."),
  duration_ms: z.number().int().positive().optional().describe("Clip length in milliseconds, if known."),
  mime: z.string().max(120).optional().describe("Audio MIME type, e.g. audio/ogg, audio/mpeg. Default audio/ogg."),
  thread_label: z.string().max(120).regex(/^[a-zA-Z0-9._-]+$/).optional(),
});

// ---- Helpers ----

/** Deterministic DM thread id (sorted pair) — must match mdm.ts dmThreadId. */
function dmThreadId(selfId: string, otherId: string, label?: string): string {
  const [a, b] = [selfId, otherId].sort();
  return label ? `dm:${a}:${b}:${label}` : `dm:${a}:${b}`;
}

/** Pack a mosadd.chat.v1 control/voice envelope into the opaque payload bytes. */
function packEnvelope(obj: Record<string, unknown>): Uint8Array {
  const envelope = { v: PROTOCOL_VERSION, sent_at: new Date().toISOString(), ...obj };
  return new Uint8Array(Buffer.from(JSON.stringify(envelope), "utf8"));
}

async function signalDm(
  ctx: MosaddToolContext,
  to: string,
  threadLabel: string | undefined,
  envelope: Record<string, unknown>,
): Promise<{ message_id?: string; thread_id: string }> {
  const dm = ctx.providers.dm;
  const selfId = await dm.selfId();
  const threadId = dmThreadId(selfId, to, threadLabel);
  const res = await dm.send({ to, threadId, payload: packEnvelope(envelope) });
  return { message_id: (res as { message_id?: string })?.message_id, thread_id: threadId };
}

// ---- Handlers ----

async function mDM_call_start(
  input: z.infer<typeof mDM_call_start_input>,
  ctx: MosaddToolContext,
): Promise<{
  room_id: string;
  token: string;
  url: string;
  identity: string;
  mode: "audio" | "video";
  invited: boolean;
  thread_id: string;
}> {
  const dm = ctx.providers.dm;
  const selfId = await dm.selfId();
  const mode = input.video ? "video" : "audio";

  // Stable room label tied to the DM pair so re-dials reuse one room.
  const label = `dmcall-${dmThreadId(selfId, input.to, input.thread_label).replace(/[^a-zA-Z0-9._-]/g, "-")}`.slice(0, 120);
  const { roomId } = await ctx.providers.voice.createRoom(label);
  const ticket = await ctx.providers.voice.joinTicket(roomId);

  let invited = false;
  let thread_id = dmThreadId(selfId, input.to, input.thread_label);
  try {
    const sig = await signalDm(ctx, input.to, input.thread_label, {
      type: "call_invite",
      room_id: roomId,
      mode,
      from: selfId,
    });
    thread_id = sig.thread_id;
    invited = true;
  } catch (e) {
    ctx.log("warn", "mDM_call_start: invite signal failed (room still usable)", {
      error: (e as Error).message,
    });
  }

  ctx.log("debug", "mDM_call_start", { room_id: roomId, mode, invited });
  return { room_id: roomId, token: ticket.token, url: ticket.url, identity: ticket.identity, mode, invited, thread_id };
}

async function mDM_call_answer(
  input: z.infer<typeof mDM_call_answer_input>,
  ctx: MosaddToolContext,
): Promise<{ room_id: string; token: string; url: string; identity: string }> {
  const ticket = await ctx.providers.voice.joinTicket(input.room_id);
  ctx.log("debug", "mDM_call_answer", { room_id: ticket.roomId, identity: ticket.identity });
  return { room_id: ticket.roomId, token: ticket.token, url: ticket.url, identity: ticket.identity };
}

async function mDM_call_end(
  input: z.infer<typeof mDM_call_end_input>,
  ctx: MosaddToolContext,
): Promise<{ room_id: string; signalled: boolean }> {
  let signalled = false;
  if (input.to) {
    try {
      await signalDm(ctx, input.to, input.thread_label, { type: "call_end", room_id: input.room_id });
      signalled = true;
    } catch (e) {
      ctx.log("warn", "mDM_call_end: hangup signal failed", { error: (e as Error).message });
    }
  }
  ctx.log("debug", "mDM_call_end", { room_id: input.room_id, signalled });
  return { room_id: input.room_id, signalled };
}

async function mDM_voice_note(
  input: z.infer<typeof mDM_voice_note_input>,
  ctx: MosaddToolContext,
): Promise<{ message_id?: string; thread_id: string }> {
  const sig = await signalDm(ctx, input.to, input.thread_label, {
    type: "voice_note",
    audio_url: input.audio_url,
    duration_ms: input.duration_ms ?? null,
    mime: input.mime ?? "audio/ogg",
  });
  ctx.log("debug", "mDM_voice_note", { thread_id: sig.thread_id });
  return sig;
}

// ---- Registration ----

export const mdmVoiceTools: MosaddTool[] = [
  {
    name: "mDM_call_start",
    requires: "network",
    description:
      "Start a 1:1 real-time voice (or video) call with a contact — the ordinary full-duplex phone-style call (NOT walkie-talkie mTALK, NOT PSTN mCALL). Creates a room, returns join credentials (token + media url), and drops a `call_invite` control message in the DM thread so the contact can answer. Set video:true for video.",
    inputSchema: mDM_call_start_input,
    handler: mDM_call_start as MosaddTool["handler"],
  },
  {
    name: "mDM_call_answer",
    requires: "network",
    description:
      "Answer an incoming 1:1 call by its room_id (from the call_invite seen via mDM_list). Returns join credentials (token + media url) for the same room.",
    inputSchema: mDM_call_answer_input,
    handler: mDM_call_answer as MosaddTool["handler"],
  },
  {
    name: "mDM_call_end",
    requires: "network",
    description:
      "End a 1:1 call. The audio leg ends when clients disconnect; pass `to` to also drop a `call_end` (hangup) control message in the contact's DM thread.",
    inputSchema: mDM_call_end_input,
    handler: mDM_call_end as MosaddTool["handler"],
  },
  {
    name: "mDM_voice_note",
    requires: "network",
    description:
      "Send an asynchronous voice note to a contact: references an already-uploaded audio clip (audio_url) and posts it as a `voice_note` message in the DM thread. Use for fire-and-forget voice instead of a live call.",
    inputSchema: mDM_voice_note_input,
    handler: mDM_voice_note as MosaddTool["handler"],
  },
];
