/**
 * mROOM text mode — send + list messages inside a private room.
 *
 * mROOM_send_message and mROOM_list_messages route through the same
 * m0ssad-3 `message-send` / `message-list` Edge Functions that mDM uses,
 * but with `space_id: 'rooms'` and `thread_id: 'privroom:<room_id>'` so the
 * RLS policies apply room-membership checks rather than DM contact checks.
 *
 * Voice in rooms (PTT, audio) lands separately via mTALK_start_session
 * over the WebRTC daemon — see LINEAR-2145.
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { invokeFunction, readSupabaseEnv } from "../providers/supabase.js";

const PROTOCOL_VERSION = "mosadd.chat.v1";

const RoomId = z.string().min(1).describe("Private room id (UUID). From mROOM_create / mROOM_list.");

const mROOM_send_message_input = z.object({
  room_id: RoomId,
  text: z.string().min(1).max(64_000).describe("Message body (UTF-8). Max 64 KB."),
  reply_to_id: z.string().optional().describe("Optional id of the message being replied to."),
});

const mROOM_list_messages_input = z.object({
  room_id: RoomId,
  limit: z.number().int().min(1).max(200).default(50).optional(),
  cursor: z.string().optional().describe("Opaque pagination cursor from a prior list response."),
});

function packPlaintextPayload(text: string, replyToId?: string): string {
  const envelope = {
    v: PROTOCOL_VERSION,
    type: "text",
    text,
    reply_to: replyToId ?? null,
    sent_at: new Date().toISOString(),
  };
  return Buffer.from(JSON.stringify(envelope), "utf8").toString("base64");
}

function unpackPayload(payload: string): { text: string } {
  try {
    const json = Buffer.from(payload, "base64").toString("utf8");
    const obj = JSON.parse(json);
    if (typeof obj?.text === "string") return obj;
  } catch {
    /* fall through */
  }
  return { text: "<ciphertext>" };
}

async function mROOM_send_message(
  input: z.infer<typeof mROOM_send_message_input>,
  ctx: MosaddToolContext,
): Promise<{ message_id: string; delivered_at: string; thread_id: string }> {
  readSupabaseEnv();
  const thread_id = `privroom:${input.room_id}`;
  ctx.log("debug", "mROOM_send_message", { thread_id });

  const data = await invokeFunction<{ message?: { id: string; created_at: string } }>(
    "message-send",
    {
      space_id: "rooms",
      thread_id,
      encrypted_payload: packPlaintextPayload(input.text, input.reply_to_id),
      message_type: "text",
      protocol_version: PROTOCOL_VERSION,
      reply_to_id: input.reply_to_id ?? null,
    },
  );

  if (!data?.message?.id) {
    throw new Error("message-send returned no message id");
  }

  return {
    message_id: data.message.id,
    delivered_at: data.message.created_at ?? new Date().toISOString(),
    thread_id,
  };
}

async function mROOM_list_messages(
  input: z.infer<typeof mROOM_list_messages_input>,
  ctx: MosaddToolContext,
): Promise<{
  messages: Array<{ id: string; sender_identity_id: string; text: string; timestamp: string }>;
  next_cursor: string | null;
}> {
  readSupabaseEnv();
  const thread_id = `privroom:${input.room_id}`;
  ctx.log("debug", "mROOM_list_messages", { thread_id });

  type MessageListResponse = {
    messages?: Array<{
      id: string;
      sender_identity_id: string;
      encrypted_payload: string;
      created_at: string;
    }>;
    next_cursor?: string | null;
  };

  const data = await invokeFunction<MessageListResponse>("message-list", {
    space_id: "rooms",
    thread_id,
    limit: input.limit ?? 50,
    cursor: input.cursor,
  });

  return {
    messages: (data?.messages ?? []).map((m) => ({
      id: m.id,
      sender_identity_id: m.sender_identity_id,
      text: unpackPayload(m.encrypted_payload).text,
      timestamp: m.created_at,
    })),
    next_cursor: data?.next_cursor ?? null,
  };
}

export const mroomMessagesTools: MosaddTool[] = [
  {
    name: "mROOM_send_message",
    requires: "network",
    description:
      "Send a text message into a private room. Authorisation: must be a member (or guest with a valid token). Alpha payload is plaintext base64; v0.2 wraps with Double Ratchet.",
    inputSchema: mROOM_send_message_input,
    handler: mROOM_send_message as MosaddTool["handler"],
  },
  {
    name: "mROOM_list_messages",
    requires: "network",
    description:
      "List recent text messages in a private room. Cursor-paginated, newest first.",
    inputSchema: mROOM_list_messages_input,
    handler: mROOM_list_messages as MosaddTool["handler"],
  },
];
