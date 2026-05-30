/**
 * SupabaseDmProvider — the default (network) DmProvider.
 *
 * Implements the transport-agnostic `DmProvider` contract from
 * `@m0ssad/providers` over the m0ssad-3 Supabase Edge Functions
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
} from "@m0ssad/providers";
import { getSupabase, invokeFunction, readSupabaseEnv } from "./supabase.js";

const PROTOCOL_VERSION = "mosadd.chat.v1";

export class SupabaseDmProvider implements DmProvider {
  private cachedSelfId: string | null = null;

  async selfId(): Promise<string> {
    if (this.cachedSelfId) return this.cachedSelfId;
    readSupabaseEnv(); // fail fast with an actionable error if BYOK env missing
    const sb = getSupabase();
    const { data: u, error: ue } = await sb.auth.getUser();
    if (ue || !u?.user) {
      throw new Error(
        "Unable to resolve current user. Ensure M0SSAD_USER_JWT is set to a valid Supabase session token.",
      );
    }
    const { data: identity, error } = await sb
      .from("identities")
      .select("id")
      .eq("user_id", u.user.id)
      .maybeSingle();
    if (error || !identity) {
      throw new Error("Current user has no mosadd identity row. Sign in to mosadd.com first.");
    }
    this.cachedSelfId = identity.id as string;
    return this.cachedSelfId;
  }

  async send(args: DmSendArgs): Promise<DmSendResult> {
    const encrypted_payload = Buffer.from(args.payload).toString("base64");
    type MessageSendResponse = { message?: { id: string; created_at: string } };
    const data = await invokeFunction<MessageSendResponse>("message-send", {
      space_id: "dm",
      thread_id: args.threadId,
      encrypted_payload,
      message_type: "text",
      protocol_version: PROTOCOL_VERSION,
      recipient_account_id: args.to,
      reply_to_id: args.replyToId ?? null,
    });
    if (!data?.message?.id) {
      throw new Error("message-send returned no message id");
    }
    return {
      id: data.message.id,
      deliveredAt: data.message.created_at ?? new Date().toISOString(),
    };
  }

  async list(args: DmListArgs): Promise<DmListResult> {
    type MessageListResponse = {
      messages?: Array<{
        id: string;
        sender_identity_id: string;
        thread_id: string;
        encrypted_payload: string;
        created_at: string;
      }>;
      next_cursor?: string | null;
    };
    const data = await invokeFunction<MessageListResponse>("message-list", {
      space_id: "dm",
      thread_id: args.threadId,
      limit: args.limit ?? 50,
      cursor: args.cursor,
    });
    return {
      messages: (data?.messages ?? []).map((m) => ({
        id: m.id,
        senderId: m.sender_identity_id,
        payload: new Uint8Array(Buffer.from(m.encrypted_payload, "base64")),
        timestamp: m.created_at,
        threadId: m.thread_id,
      })),
      nextCursor: data?.next_cursor ?? null,
    };
  }
}
