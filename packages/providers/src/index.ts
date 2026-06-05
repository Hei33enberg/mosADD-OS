/**
 * @mosadd/providers — vendor adapters for mosadd
 *
 * Pluggable backends: forked LiveKit (m0ssad-fabric), Routr (SIP),
 * nwaku (p2p messaging), Dendrite (Matrix federation), Telnyx, Twilio,
 * Resend, ElevenLabs, and a passthrough Supabase adapter for the
 * Phase 1 strangler-fig migration from the legacy mosadd consumer app.
 */

export const VERSION = "3.0.0-alpha.0" as const;

// Transport-agnostic channel provider contracts. Hosts (e.g. cymru-os)
// implement these to route channels over their own carriers. mosadd-os ships
// default network adapters; the host injects alternatives via the DI seam in
// `createMosaddServer({ providers })`.
export type {
  DmProvider,
  DmSendArgs,
  DmSendResult,
  DmListArgs,
  DmListResult,
  DmMessage,
} from "./dm.js";

// mTALK push-to-talk (half-duplex voice). The default network provider
// coordinates a LiveKit room + authoritative floor state; a radio host injects
// a provider that maps the floor onto a physical RF channel.
export type {
  VoiceProvider,
  FloorSnapshot,
  FloorRequestResult,
  VoiceJoinTicket,
} from "./voice.js";
