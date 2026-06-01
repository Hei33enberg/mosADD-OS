/**
 * VoiceProvider — transport-agnostic push-to-talk (mTALK) backend contract.
 *
 * mTALK is half-duplex by design: a walkie-talkie, not a conference call. At
 * most ONE participant holds the "floor" (is transmitting) at a time; others
 * queue. This contract is the DI seam that lets a HOST swap the transport:
 *
 *  - Network host: floor is coordinated by a server (LiveKit room for the audio
 *    media + an authoritative floor-state table). mosadd-os ships this default.
 *  - Radio host (cymru-os hardware): the floor IS the physical RF channel —
 *    carrier-sense + the hardware PTT button. The host injects a VoiceProvider
 *    that maps these calls onto the radio, and mosadd-os stays unaware of RF.
 *
 * Contract rules:
 *  - `roomId` is an opaque routing key. The provider uses what its transport
 *    needs (LiveKit room name / radio channel number).
 *  - Floor decisions are AUTHORITATIVE in the provider. mosadd-os asks; the
 *    provider answers who holds the floor. The reference half-duplex state
 *    machine lives in `@mosadd/mcp` (floor.ts) and is reused by the default
 *    network provider; a radio provider answers from hardware instead.
 *  - Errors must be thrown as `Error` with an agent-readable message.
 */

/** A point-in-time snapshot of a PTT room's floor (who is transmitting). */
export interface FloorSnapshot {
  roomId: string;
  /** Participant currently holding the floor (transmitting), or null if idle. */
  holder: string | null;
  /** ISO-8601 time the current holder acquired the floor (null if idle). */
  since: string | null;
  /** Ordered waiting list (FIFO) of participants who requested the floor. */
  queue: string[];
}

/** Result of asking for the floor (pressing PTT). */
export interface FloorRequestResult {
  /** True if the caller now holds the floor and may transmit. */
  granted: boolean;
  /** Queue position (1-based) when not granted; 0 when granted. */
  position: number;
  snapshot: FloorSnapshot;
}

/** Credentials to join a PTT room's media transport (e.g. a LiveKit token). */
export interface VoiceJoinTicket {
  /** Bearer token for the media server. */
  token: string;
  /** WebSocket/media URL to connect to. */
  url: string;
  /** The participant identity the token was minted for. */
  identity: string;
  roomId: string;
}

export interface VoiceProvider {
  /** Resolve the local participant id this provider acts as. May be cached. */
  selfId(): Promise<string>;
  /** Ensure a PTT room exists (idempotent). Returns the canonical room id. */
  createRoom(label?: string): Promise<{ roomId: string }>;
  /** Mint credentials to join a room's media transport. */
  joinTicket(roomId: string): Promise<VoiceJoinTicket>;
  /** Press PTT: request the floor. Authoritative half-duplex decision. */
  requestFloor(roomId: string): Promise<FloorRequestResult>;
  /** Release PTT: give up the floor (or cancel a queued request). */
  releaseFloor(roomId: string): Promise<FloorSnapshot>;
  /** Read the current floor state without changing it. */
  floorState(roomId: string): Promise<FloorSnapshot>;
}
