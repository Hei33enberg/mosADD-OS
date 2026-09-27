/**
 * SupabaseDmProvider — the default (network) DmProvider.
 *
 * Implements the transport-agnostic `DmProvider` contract from
 * `@mosadd/providers` over the mosadd Supabase Edge Functions
 * (`message-send` / `message-list`). This is the strangler-fig network path;
 * a carrier-aware host injects a different DmProvider for radio.
 *
 * The provider receives OPAQUE bytes and base64-wraps them into the
 * `encrypted_payload` string the Edge Function expects — it does not know or
 * care that the bytes are (for alpha) a plaintext `mosadd.chat.v1` envelope.
 */

import type {
  DmProvider,
  DmSendArgs,
  DmSendResult,
  DmListArgs,
  DmListResult,
  DmMessage,
} from "@mosadd/providers";
import { getSupabase, invokeFunction, readSupabaseEnv } from "./supabase.js";

const PROTOCOL_VERSION = "mosadd.chat.v1";

/**
 * ⛔ THE CANONICAL mDM TEXT TYPE IS `txt`. The app sends and renders `txt`; `text` is a legacy
 * spelling the server keeps only so old clients are not refused (message-send
 * CLIENT_SENDABLE_MESSAGE_TYPES, "text 18 legacy, last written 2026-07-08"). This provider kept
 * writing `text` for every MCP DM until 27.09 — the last writer of the legacy type.
 */
export const MDM_TEXT_MESSAGE_TYPE = "txt";

/**
 * ⛔ AN E2EE ENVELOPE SEALED BY MCP ON A PERSON'S KEY IS TYPED `text` — ON PURPOSE (27.09.2026).
 * The app's readOwnMdmMessage (apps/web/src/lib/mdmE2ee.ts, from f95557f) explains an unreadable
 * OWN bubble by message_type: `text` → reason "agent" („wysłane przez agenta/MCP bez kopii dla
 * Ciebie"), anything else → "device" („wysłane z innego urządzenia"). MCP holds an API-key seed,
 * never the person's app seed, so it can never write a self copy the app opens — typing its
 * envelope `txt` made the app tell the owner a false reason. `text` stays client-sendable in
 * message-send (CLIENT_SENDABLE_MESSAGE_TYPES) precisely for this lane. Plaintext stays `txt`.
 */
export const MDM_MCP_SEALED_MESSAGE_TYPE = "text";

/**
 * Supabase-only extras for a DM send. The transport-agnostic DmSendArgs (@mosadd/providers)
 * carries opaque bytes only; the network lane can additionally store the two recoverable copies
 * the app reads (see sealForSelf / sealForPeerRecoverable in crypto/mdm-session.ts). A radio
 * provider ignores these fields.
 */
export interface DmSendExtras {
  messageType?: string;
  /** "s1." copy sealed to the sender's self-read key → `messages.self_payload`. */
  selfPayload?: string | null;
  /** "r1." copy sealed to the recipient's identity → `messages.recipient_self_payload`. */
  recipientSelfPayload?: string | null;
}
export type DmSendArgsExt = DmSendArgs & DmSendExtras;

/** A listed DM plus the recoverable copies message-list returns (RLS: own copy only). */
export interface DmMessageExt extends DmMessage {
  selfPayload?: string | null;
  recipientSelfPayload?: string | null;
  messageType?: string;
}

export class SupabaseDmProvider implements DmProvider {
  private cachedSelfId: string | null = null;
  private cachedSelfKind: string | null = null;

  /**
   * `identities.kind` of the caller ("human" | "agent" | …). An agent LINE owns its mDM
   * identity outright (its key is its only runtime); a human's identity is anchored in the app.
   * ensureOwnBundlePublished uses this to decide whether a stale bundle may be replaced.
   */
  async selfKind(): Promise<string | null> {
    await this.selfId();
    return this.cachedSelfKind;
  }

  /**
   * `identities.kind` of a PEER, or null when it cannot be read (RLS can_see_identity scopes rows
   * to contacts / thread co-members; a miss is not an error). mDM_send uses it exactly like the
   * app's ChatPanel `peerIsAgent` (theirIdent.kind === 'agent' || iAmAgent): a DM to an agent
   * line is sent in the clear, because the line must read it (rozkaz Króla 20.09).
   */
  async peerKind(peerId: string): Promise<string | null> {
    try {
      const sb = getSupabase();
      const { data, error } = await sb.from("identities").select("kind").eq("id", peerId).limit(1).maybeSingle();
      if (error || !data) return null;
      return typeof data.kind === "string" ? data.kind : null;
    } catch {
      return null;
    }
  }

  async selfId(): Promise<string> {
    if (this.cachedSelfId) return this.cachedSelfId;
    readSupabaseEnv(); // fail fast with an actionable error if BYOK env missing
    const sb = getSupabase();
    const { data: u, error: ue } = await sb.auth.getUser();
    if (ue || !u?.user) {
      throw new Error(
        "Unable to resolve current user. Ensure MOSADD_USER_JWT is set to a valid Supabase session token.",
      );
    }
    const { data: identity, error } = await sb
      .from("identities")
      .select("id, kind")
      .eq("user_id", u.user.id)
      .maybeSingle();
    if (error || !identity) {
      throw new Error("Current user has no mosadd identity row. Sign in to mosadd.com first.");
    }
    this.cachedSelfId = identity.id as string;
    this.cachedSelfKind = typeof identity.kind === "string" ? identity.kind : null;
    return this.cachedSelfId;
  }

  async send(args: DmSendArgsExt): Promise<DmSendResult> {
    const encrypted_payload = Buffer.from(args.payload).toString("base64");
    type MessageSendResponse = { message?: { id: string; created_at: string } };
    const data = await invokeFunction<MessageSendResponse>("message-send", {
      space_id: "dm",
      thread_id: args.threadId,
      encrypted_payload,
      message_type: args.messageType ?? MDM_TEXT_MESSAGE_TYPE,
      protocol_version: PROTOCOL_VERSION,
      recipient_account_id: args.to,
      reply_to_id: args.replyToId ?? null,
      // Same optional columns the app writes (ircApi.sendThreadMessage); omitted when absent.
      ...(args.selfPayload ? { self_payload: args.selfPayload } : {}),
      ...(args.recipientSelfPayload ? { recipient_self_payload: args.recipientSelfPayload } : {}),
    });
    if (!data?.message?.id) {
      throw new Error("message-send returned no message id");
    }
    return {
      id: data.message.id,
      deliveredAt: data.message.created_at ?? new Date().toISOString(),
    };
  }

  async publishPrekeyBundle(bundle: Uint8Array): Promise<void> {
    // Network key directory. Server-side fn (`prekey-bundle-publish`) is the
    // the mosadd hub's responsibility — it stores the opaque bundle keyed by the
    // caller's identity (resolved from the JWT). mosadd-os just ships bytes.
    await invokeFunction<{ ok: boolean }>("prekey-bundle-publish", {
      bundle: Buffer.from(bundle).toString("base64"),
    });
  }

  async fetchPrekeyBundle(peerId: string): Promise<Uint8Array | null> {
    type FetchResponse = { bundle?: string | null };
    const data = await invokeFunction<FetchResponse>("prekey-bundle-fetch", {
      peer_id: peerId,
    });
    if (!data?.bundle) return null;
    return new Uint8Array(Buffer.from(data.bundle, "base64"));
  }

  async list(args: DmListArgs): Promise<DmListResult> {
    type MessageListResponse = {
      messages?: Array<{
        id: string;
        sender_identity_id: string;
        thread_id: string;
        encrypted_payload: string;
        created_at: string;
        message_type?: string | null;
        self_payload?: string | null;
        recipient_self_payload?: string | null;
      }>;
      cursor?: string | null;
      has_more?: boolean;
      next_before?: string | null;
    };
    // message-list paginates history via `before` (a created_at marker) and returns
    // the next marker as `cursor` — NOT `cursor` in / `next_cursor` out.
    const data = await invokeFunction<MessageListResponse>("message-list", {
      space_id: "dm",
      thread_id: args.threadId,
      limit: args.limit ?? 50,
      before: args.cursor,
    });
    return {
      messages: (data?.messages ?? []).map((m): DmMessageExt => ({
        id: m.id,
        senderId: m.sender_identity_id,
        payload: new Uint8Array(Buffer.from(m.encrypted_payload, "base64")),
        timestamp: m.created_at,
        threadId: m.thread_id,
        messageType: m.message_type ?? undefined,
        selfPayload: m.self_payload ?? null,
        recipientSelfPayload: m.recipient_self_payload ?? null,
      })),
      // history mode (`before`) returns `next_before`; incremental (`since`) returns `cursor`+`has_more`.
      nextCursor: data?.next_before ?? (data?.has_more ? (data?.cursor ?? null) : null),
    };
  }
}
