/**
 * PTT capture → ingest → RAG transcription.
 *
 * mTALK (mtalk.ts) drives the live half-duplex FLOOR (who may transmit). What it
 * does NOT do is capture a finished PTT transmission as a durable, queued message
 * — i.e. a recorded "over" that lands in a channel's queued-PTT log AND (opt-in)
 * gets transcribed into RAG. That's this module.
 *
 * Flow (per the Lane A contract):
 *   1. agent records/has a PTT clip → base64 → uploadBlob(kind:'ptt') to
 *      'voice-blobs'.
 *   2. call `ptt-ingest` EF with the attachment descriptor + routing (which
 *      channel/room the "over" belongs to). The EF persists a queued-PTT message.
 *   3. if the user has opted in to RAG, `rag-transcribe` runs and the transcript
 *      lands in user_embeddings(source_type='ptt').
 *
 * STATUS: scaffold — `ptt-ingest` is not yet deployed. Upload is real; the EF
 * call shape is best-guess (TODO Lane A).
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { invokeFunction, readSupabaseEnv } from "../providers/supabase.js";
import { uploadBlob, decodeBase64Body } from "../providers/blob-upload.js";

const mTALK_ingest_ptt_input = z.object({
  audio_base64: z
    .string()
    .min(1)
    .max(20_000_000)
    .describe("Recorded PTT 'over' as base64 (or data: URL)."),
  mime: z.string().min(1).max(120).default("audio/ogg"),
  duration_ms: z.number().int().positive().optional(),
  // Routing: exactly one of room_id / channel_id identifies where the over lands.
  channel_id: z.string().optional().describe("mIRC channel id — route the queued PTT into the channel's PTT log."),
  // room_id retained for the rare mTALK-only PTT room (no mIRC channel backing). mROOM is gone — do NOT pass an mROOM id (will 404). Prefer channel_id.
  room_id: z.string().optional().describe("Optional mTALK-only PTT room id (no mIRC channel backing). For mIRC channels use channel_id."),
  transcribe: z
    .boolean()
    .optional()
    .describe("Request RAG transcription. Honored only if the user has opted in to rag ingest; ignored otherwise. Default true."),
});

async function mTALK_ingest_ptt(
  input: z.infer<typeof mTALK_ingest_ptt_input>,
  ctx: MosaddToolContext,
): Promise<{ ptt_id: string; queued: true; transcription: "queued" | "skipped" | "opted_out" }> {
  readSupabaseEnv();
  if (!input.channel_id && !input.room_id) {
    throw new Error("mTALK_ingest_ptt requires one of channel_id or room_id to route the queued PTT.");
  }
  const prefix = input.channel_id ? `chat:${input.channel_id}` : `room:${input.room_id}`;
  const attachment = await uploadBlob({
    kind: "ptt",
    bytes: decodeBase64Body(input.audio_base64),
    mime: input.mime,
    prefix,
    duration_ms: input.duration_ms,
  });

  ctx.log("debug", "mTALK_ingest_ptt invoking ptt-ingest", { prefix, transcribe: input.transcribe ?? true });

  // TODO(Lane A): `ptt-ingest` EF not yet deployed. Confirm request/response shape.
  // Expected: persists a queued-PTT message_meta row (message_type:'ptt') with the
  // attachment, then (if rag opt-in) enqueues rag-transcribe → user_embeddings(source_type='ptt').
  const res = await invokeFunction<{
    ptt_id?: string;
    transcription?: "queued" | "skipped" | "opted_out";
  }>("ptt-ingest", {
    attachment,
    channel_id: input.channel_id ?? null,
    room_id: input.room_id ?? null,
    transcribe: input.transcribe ?? true,
  });

  return {
    ptt_id: res.ptt_id ?? "",
    queued: true,
    transcription: res.transcription ?? "queued",
  };
}

export const pttIngestTools: MosaddTool[] = [
  {
    name: "mTALK_ingest_ptt",
    requires: "network",
    description:
      "Capture a finished PTT transmission (an 'over') as a durable, QUEUED PTT message in an mIRC channel, and — if the user has opted in to RAG — transcribe it into searchable knowledge. Pass the clip as base64 + a route (channel_id; or room_id for an mTALK-only PTT room without a channel backing). Complements mTALK_press/release (which only manage the live floor).",
    inputSchema: mTALK_ingest_ptt_input,
    handler: mTALK_ingest_ptt as MosaddTool["handler"],
  },
];
