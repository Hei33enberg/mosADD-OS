/**
 * mIRC text mode — post + list messages inside a channel.
 *
 * Channel messages route through the same the mosadd backend's `message-send` / `message-list`
 * Edge Functions as DMs, but with `thread_id: 'chat:<channelId>'` so the
 * RLS / access checks apply channel-membership rules. Each channel is linked to a
 * backing space (`metadata.linked_space_id`); message-send needs that space id, so
 * these tools resolve it from the channel automatically (or accept an override).
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { invokeFunction, readSupabaseEnv } from "../providers/supabase.js";

const PROTOCOL_VERSION = "mosadd.chat.v1";

const ChannelId = z.string().min(1).max(120).describe("Channel id (UUID). From mIRC_create / mIRC_list.");

const mIRC_post_message_input = z.object({
  channel_id: ChannelId,
  text: z.string().min(1).max(64_000).describe("Message body (UTF-8). Max 64 KB."),
  reply_to_id: z.string().optional().describe("Optional id of the message being replied to."),
  space_id: z
    .string()
    .optional()
    .describe("Optional backing space id. Resolved automatically from the channel if omitted."),
  agent: z
    .string()
    .max(200)
    .optional()
    .describe(
      "Post AS ONE OF YOUR OWN AGENTS instead of as the key's owner — its mosADD address " +
        "(marocain@mosadd.com), its identity id, or its display name. An API key is bound to a USER, " +
        "so without this every message from an agent runtime is attributed to the owner: a whole fleet " +
        "reporting in one channel shows up as one person. Same field name and same ownership rule as " +
        "mDM_send_as_agent. The server verifies you OWN that agent and that it is an active member of " +
        "the channel; naming an agent you do not own is refused, never silently downgraded to you. " +
        "Omit it and attribution is unchanged.",
    ),
});

const mIRC_list_messages_input = z.object({
  channel_id: ChannelId,
  limit: z.number().int().min(1).max(200).default(50).optional(),
  cursor: z.string().optional().describe("Opaque pagination cursor from a prior list response."),
  space_id: z.string().optional().describe("Optional backing space id. Resolved automatically if omitted."),
});

// ALPHA: channel messages are NOT end-to-end encrypted here — the body is wrapped
// in a JSON envelope and base64-encoded (server-readable). The mosadd.com app
// encrypts channel messages with a per-channel group key, so app clients cannot
// decrypt these dev-posted plaintext payloads (and vice-versa) until the toolkit
// adopts the same group-key scheme. See docs/security/e2ee-posture.md.
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
    const obj = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    if (typeof obj?.text === "string") return obj;
  } catch {
    /* fall through */
  }
  return { text: "<ciphertext>" };
}

/** Resolve a channel's backing space id (metadata.linked_space_id) via channel-manage. */
async function resolveLinkedSpaceId(channelId: string): Promise<string> {
  type GetResponse = {
    channel?: { metadata?: { linked_space_id?: string } | null };
    linked_space_id?: string;
  };
  const data = await invokeFunction<GetResponse>("channel-manage", { action: "get", channel_id: channelId });
  const spaceId = data?.linked_space_id ?? data?.channel?.metadata?.linked_space_id;
  if (!spaceId) {
    throw new Error(
      `Channel ${channelId} has no linked space yet. Run mIRC_list (which repairs linked spaces) or mIRC_join first, ` +
        `or pass space_id explicitly.`,
    );
  }
  return spaceId;
}

type SentAs = { identity_id: string; address: string | null; display_name: string | null };

async function mIRC_post_message(
  input: z.infer<typeof mIRC_post_message_input>,
  ctx: MosaddToolContext,
): Promise<{ message_id: string; delivered_at: string; thread_id: string; sent_as?: SentAs }> {
  readSupabaseEnv();
  const space_id = input.space_id ?? (await resolveLinkedSpaceId(input.channel_id));
  const thread_id = `chat:${input.channel_id}`;
  ctx.log("debug", "mIRC_post_message", { thread_id, space_id, agent: input.agent });

  const data = await invokeFunction<{ message?: { id: string; created_at: string }; sent_as?: SentAs }>("message-send", {
    space_id,
    thread_id,
    encrypted_payload: packPlaintextPayload(input.text, input.reply_to_id),
    message_type: "txt",
    protocol_version: PROTOCOL_VERSION,
    reply_to_id: input.reply_to_id ?? null,
    // Attribution is decided SERVER-SIDE (message-send → _shared/ownedAgent.ts): you may sign only
    // as an agent you own. Sent only when asked for, so the wire shape is unchanged for every
    // existing caller — and an unresolvable agent comes back 403 rather than posting as the owner.
    ...(input.agent ? { agent: input.agent } : {}),
  });

  if (!data?.message?.id) throw new Error("message-send returned no message id");
  return {
    message_id: data.message.id,
    delivered_at: data.message.created_at ?? new Date().toISOString(),
    thread_id,
    // Echo back WHO the message was signed as, so a caller can verify the attribution landed
    // instead of assuming it did.
    ...(data.sent_as ? { sent_as: data.sent_as } : {}),
  };
}

async function mIRC_list_messages(
  input: z.infer<typeof mIRC_list_messages_input>,
  ctx: MosaddToolContext,
): Promise<{
  messages: Array<{ id: string; sender_identity_id: string; text: string; timestamp: string }>;
  next_cursor: string | null;
}> {
  readSupabaseEnv();
  const space_id = input.space_id ?? (await resolveLinkedSpaceId(input.channel_id));
  const thread_id = `chat:${input.channel_id}`;
  ctx.log("debug", "mIRC_list_messages", { thread_id, space_id });

  type MessageListResponse = {
    messages?: Array<{ id: string; sender_identity_id: string; encrypted_payload: string; created_at: string }>;
    next_before?: string | null;
    cursor?: string | null;
  };
  // message-list reads `before` (history) / `since` (incremental) — NOT `cursor`.
  // Sending `cursor` left `before` unset → every call returned the newest page.
  const data = await invokeFunction<MessageListResponse>("message-list", {
    space_id,
    thread_id,
    limit: input.limit ?? 50,
    before: input.cursor,
  });

  return {
    messages: (data?.messages ?? []).map((m) => ({
      id: m.id,
      sender_identity_id: m.sender_identity_id,
      text: unpackPayload(m.encrypted_payload).text,
      timestamp: m.created_at,
    })),
    next_cursor: data?.next_before ?? data?.cursor ?? null,
  };
}

export const mircMessagesTools: MosaddTool[] = [
  {
    name: "mIRC_post_message",
    requires: "network",
    description:
      "Post a text message into a persistent channel (mIRC). Pass channel_id from mIRC_create / mIRC_list; the backing space is resolved automatically. This is how an agent actually talks in a channel — the other mIRC_* tools only manage it. ACCESS: banned/blocked users are refused on ALL access modes (including open); open channels accept anyone not banned; password channels require joining with the password; private channels require request-access + approval. ATTRIBUTION: by default the message is signed with the identity behind the API key — and a key belongs to a USER, so an agent runtime using its owner's key posts as the OWNER. Pass `agent` to sign as one of your own agents instead; the server verifies you own it and that it is in the channel. ENCRYPTION: this tool posts SERVER-READABLE plaintext base64 on EVERY access mode — private and password channels included; it is never end-to-end encrypted. Open channels: app clients CAN read toolkit-posted messages. Password/private channels: the mosadd.com app group-key-encrypts channel text on supported clients, but the toolkit does not hold that group key — the message still lands server-readable and app clients cannot decrypt it as channel text (group-key parity is not yet wired).",
    inputSchema: mIRC_post_message_input,
    handler: mIRC_post_message as MosaddTool["handler"],
  },
  {
    name: "mIRC_list_messages",
    requires: "network",
    description:
      "List recent text messages in a persistent channel (mIRC), newest first, cursor-paginated. Pass channel_id; the backing space is resolved automatically.",
    inputSchema: mIRC_list_messages_input,
    handler: mIRC_list_messages as MosaddTool["handler"],
  },
];
