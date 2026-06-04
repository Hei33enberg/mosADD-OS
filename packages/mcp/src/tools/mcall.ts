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
];
