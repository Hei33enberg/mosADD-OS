/**
 * @mosadd/providers — provider contracts for mosadd
 *
 * Transport-agnostic interfaces the m* modules plug their backends into.
 * Interfaces only today (no vendor adapter implementations in this package);
 * the default network implementations live in @mosadd/mcp.
 */

// Keep in lockstep with package.json.
export const VERSION = "3.0.0-alpha.26" as const;

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
