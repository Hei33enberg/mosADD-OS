/**
 * BridgeProvider — common interface for every bridge adapter
 * (mMATRIX, mDISCORD, mTELEGRAM, mSLACK, mSIGNAL, mWHATSAPP, mIMESSAGE).
 *
 * Bridges let mosadd users reach contacts on other networks without those
 * contacts signing up for mosadd. Each adapter implements this interface
 * over its native protocol (MTProto, Discord Gateway, Matrix CS API, ...).
 *
 * Design adopted from the Hermes Agent `gateway/platforms/` pattern
 * (Nous Research, MIT) — see /NOTICE for full attribution.
 */

/** Identifier for a remote-network user (network-specific shape). */
export type BridgeUserHandle = string;

/** Identifier for a remote-network conversation (DM thread, channel, group, ...). */
export type BridgeConversationId = string;

/** A normalized message body — what mosadd carries across all bridges. */
export interface BridgeMessage {
  /** Globally unique id assigned by the remote network. */
  id: string;
  /** Network this message came from / is going to. */
  network: string;
  /** Conversation this belongs to. */
  conversation: BridgeConversationId;
  /** Sender's handle on the remote network. */
  from: BridgeUserHandle;
  /** Plain text body (always populated for compatibility). */
  text: string;
  /** Optional rich content — HTML, markdown, attachments, etc. */
  rich?: {
    html?: string;
    markdown?: string;
    attachments?: BridgeAttachment[];
  };
  /** Wall-clock send time as ISO-8601. */
  sent_at: string;
  /** Reply-to message id (network-scoped) if this is a reply. */
  reply_to?: string;
}

export interface BridgeAttachment {
  kind: "image" | "video" | "audio" | "file" | "voice_message";
  url: string;
  mime_type?: string;
  size_bytes?: number;
  filename?: string;
}

/** Config envelope for a bridge — each adapter validates its own shape. */
export type BridgeConfig = Record<string, unknown>;

/** Parameters for sending a message through a bridge. */
export interface SendBridgeMessageInput {
  to: BridgeConversationId | BridgeUserHandle;
  text: string;
  rich?: BridgeMessage["rich"];
  reply_to?: string;
}

export interface SendBridgeMessageResult {
  id: string;
  sent_at: string;
}

/** Cursor-paginated list. */
export interface ListMessagesInput {
  conversation: BridgeConversationId;
  limit?: number;
  cursor?: string;
}

export interface ListMessagesResult {
  messages: BridgeMessage[];
  next_cursor: string | null;
}

/**
 * Every concrete bridge implements this. Phase 1 alpha keeps handlers
 * stub-throw to make the surface visible; real protocol wiring lands per
 * bridge in their respective sub-issues of LINEAR-2168.
 */
export interface BridgeProvider {
  /** Network identifier — "matrix", "discord", "telegram", "slack", ... */
  readonly network: string;

  /** Display name shown in radar/audit logs. */
  readonly displayName: string;

  /**
   * Validate the user-supplied config and prove connectivity (lookup self,
   * fetch profile, etc.). Throws if creds are invalid or unreachable.
   */
  verifyConfig(config: BridgeConfig): Promise<{ ok: true; remote_user?: string }>;

  /** Send a message into the bridged network. */
  sendMessage(config: BridgeConfig, input: SendBridgeMessageInput): Promise<SendBridgeMessageResult>;

  /** Read messages from a conversation. */
  listMessages(config: BridgeConfig, input: ListMessagesInput): Promise<ListMessagesResult>;

  /** Resolve a handle (`@alice:matrix.org`, `@alice` on Telegram, …) to canonical id. */
  resolveHandle(config: BridgeConfig, handle: BridgeUserHandle): Promise<{ id: BridgeUserHandle; display_name?: string }>;
}

/** Thrown when an adapter is called before its dependencies are wired. */
export class BridgeNotImplementedError extends Error {
  constructor(network: string, operation: string) {
    super(
      `Bridge ${network} ${operation} is not implemented yet in this alpha. ` +
        `See https://linear.app/ip-ra/issue/LINEAR-2168 — contributions welcome.`,
    );
    this.name = "BridgeNotImplementedError";
  }
}
