/**
 * mTALK_ingest_ptt — submit a recorded PTT "over" for transcription + RAG ingest.
 *
 * The actual mIRC/mDM voice-message PERSISTENCE (writing a message_meta row,
 * fanning it out to listeners) is owned by the message-send/send-voice path,
 * NOT by this tool. ptt-ingest exists purely to bridge a finished PTT segment
 * into the user's RAG index — a row in `ptt_transcripts` (status='pending')
 * + a transcribe job that lands in `user_embeddings(source_type='ptt')`.
 *
 * Use this when an agent has a PTT audio buffer it wants searchable in the
 * user's RAG later (e.g. "what did Alice tell me on PTT yesterday?"). The
 * voice message itself is sent separately via mDM_send_voice / mIRC_send_voice.
 *
 * Auth: standard Supabase session JWT (the caller's RAG opt-in is read from
 * their account; opted-out callers get status='skipped_optout').
 * LINEAR-3998 (P4.1 PTT unify) — re-arch 2026-06-27.
 */
import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { invokeFunction, readSupabaseEnv } from "../providers/supabase.js";

const mTALK_ingest_ptt_input = z.object({
  audio_base64: z
    .string()
    .min(1)
    .max(20_000_000)
    .describe("Recorded PTT 'over' as base64 (a 'data:audio/…;base64,…' prefix is stripped if present)."),
  mime_type: z
    .string()
    .min(1)
    .max(120)
    .default("audio/webm")
    .describe("MIME type of the audio. Default audio/webm (browser MediaRecorder default)."),
  direction: z
    .enum(["human_to_agent", "agent_to_human"])
    .describe("Direction the PTT crossed: who originated, who received. 'human_to_agent' = user spoke to an agent; 'agent_to_human' = agent spoke to the user."),
  message_id: z
    .string()
    .min(1)
    .max(120)
    .optional()
    .describe("Optional id of the messages_meta row this PTT belongs to. When present, links the transcript back to the message for jump-to-source from RAG."),
  thread_id: z
    .string()
    .min(1)
    .max(120)
    .optional()
    .describe("Optional thread id (e.g. `chat:<channel_id>` or `dm:<a>:<b>`) so the transcript carries its conversational scope into RAG."),
});

interface PttIngestResponse {
  ptt_id?: string;
  status?: "pending" | "skipped_optout" | "queued";
  enqueued?: boolean;
}

async function mTALK_ingest_ptt(
  input: z.infer<typeof mTALK_ingest_ptt_input>,
  ctx: MosaddToolContext,
): Promise<{ ptt_id: string; status: string; opted_in: boolean }> {
  readSupabaseEnv();

  // Tolerate a "data:audio/…;base64,…" prefix from MediaRecorder/canvas captures.
  const audio = input.audio_base64.replace(/^data:[^;]+;base64,/, "");

  ctx.log("debug", "mTALK_ingest_ptt invoking ptt-ingest", {
    direction: input.direction,
    thread_id: input.thread_id ?? null,
    mime_type: input.mime_type,
  });

  const res = await invokeFunction<PttIngestResponse>("ptt-ingest", {
    audio_base64: audio,
    mime_type: input.mime_type,
    direction: input.direction,
    message_id: input.message_id ?? null,
    thread_id: input.thread_id ?? null,
  });

  const status = res.status ?? "pending";
  return {
    ptt_id: res.ptt_id ?? "",
    status,
    opted_in: status !== "skipped_optout",
  };
}

export const pttIngestTools: MosaddTool[] = [
  {
    name: "mTALK_ingest_ptt",
    title: "Transcribe PTT audio into memory",
    annotations: { readOnlyHint: false },
    requires: "network",
    description:
      "Submit a finished PTT 'over' (push-to-talk audio segment) for transcription into the caller's RAG index — so 'what did X say on PTT?' is searchable later. The PERSISTENCE of the voice message itself (the message_meta row + fan-out) is handled by mDM_send_voice / mIRC_send_voice; this tool is the transcription bridge only. Honors per-user RAG opt-in: opted-out callers get status='skipped_optout' (no transcript stored). Auth: Supabase session JWT.",
    inputSchema: mTALK_ingest_ptt_input,
    handler: mTALK_ingest_ptt as MosaddTool["handler"],
  },
];
