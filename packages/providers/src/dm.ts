/**
 * DmProvider — transport-agnostic direct-message backend contract.
 *
 * This is the dependency-injection seam that lets a HOST swap the transport
 * under mDM without mosadd-os knowing anything about that transport. The
 * default adapter ships network (Supabase) delivery; a carrier-aware host
 * (e.g. an off-grid radio device) injects its own implementation that dumps
 * the opaque payload bytes onto its radio link — mosadd-os stays
 * zero-awareness-of-any-specific-host.
 *
 * Contract rules:
 *  - The provider treats `payload` as OPAQUE BYTES. It does NOT parse, decode,
 *    or interpret them. Message framing / encryption / encoding all live ABOVE
 *    the provider (in the mDM tool + @m0ssad/crypto). The provider only moves
 *    bytes from A to B and back.
 *  - `threadId` and `to` are routing hints. A provider uses what its transport
 *    needs and may ignore the rest (radio may key only on `to`).
 *  - Errors must be thrown as `Error` with an agent-readable message.
 */

export interface DmSendArgs {
  /** Recipient reference (identity id / handle / call-sign). Opaque to mosadd-os. */
  to: string;
  /** Deterministic mosadd thread id (protocol-level). Provider may use or ignore. */
  threadId: string;
  /** OPAQUE message bytes. The provider must not interpret them. */
  payload: Uint8Array;
  /** Optional id of the message being replied to. */
  replyToId?: string;
}

export interface DmSendResult {
  /** Provider-assigned message id. */
  id: string;
  /** ISO-8601 delivery timestamp. */
  deliveredAt: string;
}

export interface DmListArgs {
  /** Thread to read. */
  threadId: string;
  limit?: number;
  /** Opaque pagination cursor from a previous result. */
  cursor?: string;
}

export interface DmMessage {
  id: string;
  /** Sender reference, in the same namespace as `DmSendArgs.to`. */
  senderId: string;
  /** OPAQUE payload bytes as received. Decoding happens above the provider. */
  payload: Uint8Array;
  /** ISO-8601 timestamp. */
  timestamp: string;
  threadId: string;
}

export interface DmListResult {
  messages: DmMessage[];
  nextCursor: string | null;
}

export interface DmProvider {
  /**
   * Resolve the local identity this provider sends as, in the provider's own
   * namespace (Supabase: identity-row id; radio: call-sign). Used to compute
   * deterministic thread ids. May be cached by the implementation.
   */
  selfId(): Promise<string>;
  /** Deliver opaque payload bytes to a recipient. */
  send(args: DmSendArgs): Promise<DmSendResult>;
  /** Read recent messages on a thread. */
  list(args: DmListArgs): Promise<DmListResult>;

  /**
   * Publish the LOCAL peer's prekey bundle to the key directory, keyed by this
   * provider's `selfId()`. The bundle is OPAQUE bytes — the provider does not
   * parse it. mosadd-os owns the byte format (an X3DH prekey bundle); the
   * provider only stores/announces it.
   *
   * Network adapter: writes a key-directory row. Radio adapter (cymru-os):
   * periodically announces the signed bundle on a key channel; peers cache it.
   * This is the cymru-contract-approved seam (decision "1a"): prekey
   * distribution rides the SAME provider as messages — one contract surface,
   * identical for network and radio.
   */
  publishPrekeyBundle(bundle: Uint8Array): Promise<void>;
  /**
   * Fetch a peer's published prekey bundle by their reference (same namespace
   * as `DmSendArgs.to`). Returns OPAQUE bytes, or `null` if the peer has not
   * published one yet (first contact not yet possible — caller falls back to
   * the deprecated unencrypted path or waits).
   */
  fetchPrekeyBundle(peerId: string): Promise<Uint8Array | null>;
}
