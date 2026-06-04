/**
 * mCALL — Outbound PSTN calls.
 *
 * Place a real phone call (E.164) from an agent. Control plane is MCP; audio
 * never flows through the tool call — it is bridged over LiveKit SIP (primary)
 * or a Telnyx fallback to the carrier, with an optional voice vocoder.
 *
 * Wired to the m0ssad-3 `call-start-pstn` / `call-end-pstn` Edge Functions
 * (deployed). A carrier must be wired server-side (LIVEKIT_SIP_TRUNK_ID, or
 * TELNYX_API_KEY + TELNYX_CONNECTION_ID + TELNYX_FROM_NUMBER); until then the
 * call session is created and metered but no audio leg is bridged.
 *
 * NOTE: mCALL is the telephone (PSTN). For 1:1 in-app voice use mDM; for
 * walkie-talkie / floor-controlled voice use mTALK.
 *
 * Burner numbers: mCALL_acquire_number leases an ephemeral DID (~10 min) that
 * becomes your outbound caller-ID and can receive inbound calls. Inbound rings
 * are delivered out-of-band (Supabase Realtime broadcast on
 * `mcall-inbound-<identity_id>`, or an integrator webhook) carrying a room_name;
 * mCALL_answer mints the LiveKit token to join and bridge that call. Pair with
 * the `vocoder` flag / a published vocoder track to mask the caller's voice.
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { invokeFunction, readSupabaseEnv } from "../providers/supabase.js";

// ---- Schemas ----

const E164 = z
  .string()
  .regex(/^\+\d{7,15}$/)
  .describe("Destination phone number in E.164 format, e.g. +14155550123.");

const mCALL_start_pstn_input = z.object({
  to: E164,
  vocoder: z
    .boolean()
    .optional()
    .describe("Disguise the caller's voice with a vocoder (anonymous calling). Default false."),
});

const mCALL_end_pstn_input = z.object({
  session_id: z.string().min(1).describe("Session id returned by mCALL_start_pstn."),
});

// ---- Burner (ephemeral number) schemas ----

const mCALL_acquire_number_input = z.object({}).describe(
  "No parameters. Leases the next available number for ~10 minutes (idempotent: returns your live lease if you already hold one).",
);

const mCALL_my_numbers_input = z.object({}).describe("No parameters.");

const mCALL_extend_number_input = z.object({
  number_id: z
    .string()
    .optional()
    .describe("Pool id of the number to extend. Omit to extend your current lease."),
});

const mCALL_release_number_input = z.object({
  number_id: z
    .string()
    .optional()
    .describe("Pool id of the number to release. Omit to release all numbers you hold."),
});

const mCALL_answer_input = z.object({
  room_name: z
    .string()
    .min(1)
    .describe("room_name from an inbound_call event (Realtime broadcast / integrator webhook)."),
});

// ---- Handlers ----

async function mCALL_start_pstn(
  input: z.infer<typeof mCALL_start_pstn_input>,
  ctx: MosaddToolContext,
): Promise<{
  session_id: string;
  room_name: string;
  destination_number: string;
  vocoder_enabled: boolean;
  minutes_remaining: number;
  zone: string;
  zone_label: string;
}> {
  readSupabaseEnv();
  ctx.log("debug", "mCALL_start_pstn invoking call-start-pstn", { to: input.to });
  return await invokeFunction("call-start-pstn", {
    destination_number: input.to,
    vocoder_enabled: input.vocoder ?? false,
  });
}

async function mCALL_end_pstn(
  input: z.infer<typeof mCALL_end_pstn_input>,
  ctx: MosaddToolContext,
): Promise<{ duration_ms: number; cost_credits: number }> {
  readSupabaseEnv();
  ctx.log("debug", "mCALL_end_pstn invoking call-end-pstn", { session_id: input.session_id });
  return await invokeFunction("call-end-pstn", { session_id: input.session_id });
}

// ---- Burner (ephemeral number) handlers ----

interface AcquiredNumber {
  did: { id: string; phone_number: string; hold_until: string | null };
  reused: boolean;
  hold_until: string;
  seconds_remaining: number;
}

async function mCALL_acquire_number(
  _input: z.infer<typeof mCALL_acquire_number_input>,
  ctx: MosaddToolContext,
): Promise<AcquiredNumber> {
  readSupabaseEnv();
  ctx.log("debug", "mCALL_acquire_number invoking call-did-pool acquire");
  return await invokeFunction("call-did-pool", { action: "acquire" });
}

async function mCALL_my_numbers(
  _input: z.infer<typeof mCALL_my_numbers_input>,
  ctx: MosaddToolContext,
): Promise<{ numbers: Array<{ id: string; phone_number: string; seconds_remaining: number | null }> }> {
  readSupabaseEnv();
  ctx.log("debug", "mCALL_my_numbers invoking call-did-pool mine");
  return await invokeFunction("call-did-pool", { action: "mine" });
}

async function mCALL_extend_number(
  input: z.infer<typeof mCALL_extend_number_input>,
  ctx: MosaddToolContext,
): Promise<{ did: unknown; hold_until: string; seconds_remaining: number }> {
  readSupabaseEnv();
  ctx.log("debug", "mCALL_extend_number invoking call-did-pool extend", { number_id: input.number_id });
  return await invokeFunction("call-did-pool", { action: "extend", did_id: input.number_id });
}

async function mCALL_release_number(
  input: z.infer<typeof mCALL_release_number_input>,
  ctx: MosaddToolContext,
): Promise<{ released: number; dids: unknown[] }> {
  readSupabaseEnv();
  ctx.log("debug", "mCALL_release_number invoking call-did-pool release_mine", { number_id: input.number_id });
  return await invokeFunction("call-did-pool", { action: "release_mine", did_id: input.number_id });
}

async function mCALL_answer(
  input: z.infer<typeof mCALL_answer_input>,
  ctx: MosaddToolContext,
): Promise<{ token: string; url: string; roomName: string; identity: string }> {
  readSupabaseEnv();
  ctx.log("debug", "mCALL_answer minting livekit token", { room_name: input.room_name });
  return await invokeFunction("livekit-token", { roomName: input.room_name });
}

// ---- Registration ----

export const mcallTools: MosaddTool[] = [
  {
    name: "mCALL_start_pstn",
    requires: "network",
    description:
      "Place an outbound PSTN phone call to an E.164 number. Bridges audio over an encrypted SIP relay (LiveKit SIP / Telnyx); optional voice vocoder for anonymous calling. Returns session_id, room_name, zone + per-minute cost, and minutes_remaining. Requires PSTN minutes in the wallet.",
    inputSchema: mCALL_start_pstn_input,
    handler: mCALL_start_pstn as MosaddTool["handler"],
  },
  {
    name: "mCALL_end_pstn",
    requires: "network",
    description: "End an active PSTN call by session_id. Returns call duration and credits spent.",
    inputSchema: mCALL_end_pstn_input,
    handler: mCALL_end_pstn as MosaddTool["handler"],
  },
  {
    name: "mCALL_acquire_number",
    requires: "network",
    description:
      "Lease an ephemeral 'burner' phone number for ~10 minutes. While held, it is presented as your caller-ID on mCALL_start_pstn and can receive inbound calls; it auto-recycles when the lease lapses (unless on a live call). Idempotent — returns your existing lease if you already hold one. Returns the number, hold_until and seconds_remaining.",
    inputSchema: mCALL_acquire_number_input,
    handler: mCALL_acquire_number as MosaddTool["handler"],
  },
  {
    name: "mCALL_my_numbers",
    requires: "network",
    description: "List the ephemeral numbers currently leased to you, each with its seconds_remaining.",
    inputSchema: mCALL_my_numbers_input,
    handler: mCALL_my_numbers as MosaddTool["handler"],
  },
  {
    name: "mCALL_extend_number",
    requires: "network",
    description: "Extend the lease on a held ephemeral number by another ~10 minutes (by number_id, or your current lease).",
    inputSchema: mCALL_extend_number_input,
    handler: mCALL_extend_number as MosaddTool["handler"],
  },
  {
    name: "mCALL_release_number",
    requires: "network",
    description: "Release an ephemeral number back to the pool before its lease expires (by number_id, or all you hold).",
    inputSchema: mCALL_release_number_input,
    handler: mCALL_release_number as MosaddTool["handler"],
  },
  {
    name: "mCALL_answer",
    requires: "network",
    description:
      "Answer an inbound call to your burner number. Pass the room_name from the inbound_call event; returns a LiveKit token + url so your client joins the room and bridges audio (publish a vocoder track to mask your voice on answer).",
    inputSchema: mCALL_answer_input,
    handler: mCALL_answer as MosaddTool["handler"],
  },
];
