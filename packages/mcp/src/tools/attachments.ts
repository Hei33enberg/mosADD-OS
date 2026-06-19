/**
 * Symmetric voice + file attachments across channels (mDM, mIRC).
 *
 * GOAL (Lane C): an AGENT must be able to participate in every channel the same
 * way a human does — including sending VOICE notes and FILES, not just text.
 * Today only mDM has a half-measure (`mDM_voice_note`, which takes a pre-uploaded
 * URL and posts a control envelope, NOT a first-class `voice` message via the
 * `message-send` attachments contract). mROOM and mIRC have no voice/file send
 * at all from the toolkit.
 *
 * These tools accept the blob as base64 (MCP is JSON-only), upload it to Storage
 * via the shared `uploadBlob` helper, then call `message-send` with
 * `message_type: 'voice' | 'file'` and the `attachments[]` descriptor.
 *
 * STATUS: scaffold against the Lane A contract. Compiles and uploads, but the
 * `message-send` call is the not-yet-final shape — see TODO(Lane A) markers.
 * mDM voice additionally needs client-side E2EE sealing before upload (TODO).
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { invokeFunction, readSupabaseEnv } from "../providers/supabase.js";
import { uploadBlob, decodeBase64Body, type AttachmentDescriptor } from "../providers/blob-upload.js";

const PROTOCOL_VERSION = "mosadd.chat.v1";

// ---- Shared schema fragments ----

const Base64Body = z
  .string()
  .min(1)
  .max(20_000_000)
  .describe("Attachment bytes as base64 (or a data: URL). MCP is JSON-only, so binary is base64-encoded. Max ~15 MB decoded.");

const Mime = z.string().min(1).max(120).describe("MIME type, e.g. audio/ogg, application/pdf, image/png.");
const DurationMs = z.number().int().positive().optional().describe("Audio clip length in ms (voice only), if known.");
const Filename = z.string().min(1).max(255).optional().describe("Original filename (file only).");
const ReplyTo = z.string().optional().describe("Optional id of the message being replied to.");

const ContactRef = z.string().min(1).describe("Recipient identity id (UUID). Use mDM_list_contacts to find it.");
const RoomId = z.string().min(1).describe("Room/channel id (UUID).");

const ThreadLabel = z
  .string()
  .max(120)
  .regex(/^[a-zA-Z0-9._-]+$/)
  .optional()
  .describe("Optional thread label within the conversation (mDM USP: multiple threads per contact).");

// ---- Helpers ----

/** Deterministic DM thread id (sorted pair) — must match mdm.ts dmThreadId. */
function dmThreadId(selfId: string, otherId: string, label?: string): string {
  const [a, b] = [selfId, otherId].sort();
  return label ? `dm:${a}:${b}:${label}` : `dm:${a}:${b}`;
}

/**
 * Post an attachment message through `message-send`.
 *
 * TODO(Lane A): lock the exact body shape. Current best-guess from the contract:
 *   { space_id, thread_id, message_type: 'voice'|'file', attachments: [desc],
 *     encrypted_payload: <caption envelope>, protocol_version, reply_to_id }
 * Open questions for Lane A:
 *   - is `attachments` a top-level field on message-send, or nested under the
 *     payload? (assumed top-level here)
 *   - does voice/file still require a (possibly empty) encrypted_payload caption?
 *   - mDM: who seals the blob + mints key_ref — this tool, or the EF?
 */
async function sendAttachmentMessage(
  ctx: MosaddToolContext,
  args: {
    space_id: string;
    thread_id: string;
    message_type: "voice" | "file";
    attachment: AttachmentDescriptor;
    caption?: string;
    reply_to_id?: string;
    recipient_account_id?: string;
  },
): Promise<{ message_id: string; delivered_at: string; thread_id: string }> {
  readSupabaseEnv();
  const captionEnvelope = {
    v: PROTOCOL_VERSION,
    type: args.message_type,
    text: args.caption ?? "",
    sent_at: new Date().toISOString(),
  };
  const encrypted_payload = Buffer.from(JSON.stringify(captionEnvelope), "utf8").toString("base64");

  ctx.log("debug", "sendAttachmentMessage", {
    thread_id: args.thread_id,
    message_type: args.message_type,
    bucket: args.attachment.bucket,
  });

  const data = await invokeFunction<{ message?: { id: string; created_at: string } }>("message-send", {
    space_id: args.space_id,
    thread_id: args.thread_id,
    message_type: args.message_type,
    attachments: [args.attachment], // TODO(Lane A): confirm field placement
    encrypted_payload,
    protocol_version: PROTOCOL_VERSION,
    recipient_account_id: args.recipient_account_id ?? null,
    reply_to_id: args.reply_to_id ?? null,
  });

  if (!data?.message?.id) throw new Error("message-send returned no message id (attachment)");
  return {
    message_id: data.message.id,
    delivered_at: data.message.created_at ?? new Date().toISOString(),
    thread_id: args.thread_id,
  };
}

/** Resolve a channel's backing space id — mirrors mirc-messages.ts. */
async function resolveLinkedSpaceId(channelId: string): Promise<string> {
  type GetResponse = { channel?: { metadata?: { linked_space_id?: string } | null }; linked_space_id?: string };
  const data = await invokeFunction<GetResponse>("channel-manage", { action: "get", channel_id: channelId });
  const spaceId = data?.linked_space_id ?? data?.channel?.metadata?.linked_space_id;
  if (!spaceId) throw new Error(`Channel ${channelId} has no linked space yet — run mIRC_join/mIRC_list first or pass space_id.`);
  return spaceId;
}

// ====================================================================
// mDM voice/file
// ====================================================================

const mDM_send_voice_input = z.object({
  to: ContactRef,
  audio_base64: Base64Body,
  mime: Mime.default("audio/ogg"),
  duration_ms: DurationMs,
  caption: z.string().max(2_000).optional(),
  thread_label: ThreadLabel,
  reply_to_id: ReplyTo,
});

const mDM_send_file_input = z.object({
  to: ContactRef,
  file_base64: Base64Body,
  filename: Filename,
  mime: Mime,
  caption: z.string().max(2_000).optional(),
  thread_label: ThreadLabel,
  reply_to_id: ReplyTo,
});

async function mDM_send_voice(input: z.infer<typeof mDM_send_voice_input>, ctx: MosaddToolContext) {
  const dm = ctx.providers.dm;
  const selfId = await dm.selfId();
  const thread_id = dmThreadId(selfId, input.to, input.thread_label);
  // TODO(Lane A/E2EE): mDM is client-encrypted — seal these bytes per-recipient
  // via @mosadd/crypto and pass the wrapped content key as key_ref BEFORE upload.
  // Uploading plaintext here is a scaffold-only shortcut.
  const attachment = await uploadBlob({
    kind: "voice",
    bytes: decodeBase64Body(input.audio_base64),
    mime: input.mime,
    prefix: thread_id,
    duration_ms: input.duration_ms,
  });
  return sendAttachmentMessage(ctx, {
    space_id: "dm",
    thread_id,
    message_type: "voice",
    attachment,
    caption: input.caption,
    reply_to_id: input.reply_to_id,
    recipient_account_id: input.to,
  });
}

async function mDM_send_file(input: z.infer<typeof mDM_send_file_input>, ctx: MosaddToolContext) {
  const dm = ctx.providers.dm;
  const selfId = await dm.selfId();
  const thread_id = dmThreadId(selfId, input.to, input.thread_label);
  // TODO(Lane A/E2EE): seal as above for mDM.
  const attachment = await uploadBlob({
    kind: "file",
    bytes: decodeBase64Body(input.file_base64),
    mime: input.mime,
    prefix: thread_id,
    filename: input.filename,
  });
  return sendAttachmentMessage(ctx, {
    space_id: "dm",
    thread_id,
    message_type: "file",
    attachment,
    caption: input.caption,
    reply_to_id: input.reply_to_id,
    recipient_account_id: input.to,
  });
}

// ====================================================================
// mIRC voice/file
// ====================================================================

const mIRC_send_voice_input = z.object({
  channel_id: RoomId,
  audio_base64: Base64Body,
  mime: Mime.default("audio/ogg"),
  duration_ms: DurationMs,
  caption: z.string().max(2_000).optional(),
  reply_to_id: ReplyTo,
  space_id: z.string().optional().describe("Backing space id. Resolved automatically if omitted."),
});

const mIRC_send_file_input = z.object({
  channel_id: RoomId,
  file_base64: Base64Body,
  filename: Filename,
  mime: Mime,
  caption: z.string().max(2_000).optional(),
  reply_to_id: ReplyTo,
  space_id: z.string().optional(),
});

async function mIRC_send_voice(input: z.infer<typeof mIRC_send_voice_input>, ctx: MosaddToolContext) {
  const space_id = input.space_id ?? (await resolveLinkedSpaceId(input.channel_id));
  const thread_id = `chat:${input.channel_id}`;
  const attachment = await uploadBlob({ kind: "voice", bytes: decodeBase64Body(input.audio_base64), mime: input.mime, prefix: thread_id, duration_ms: input.duration_ms });
  return sendAttachmentMessage(ctx, { space_id, thread_id, message_type: "voice", attachment, caption: input.caption, reply_to_id: input.reply_to_id });
}

async function mIRC_send_file(input: z.infer<typeof mIRC_send_file_input>, ctx: MosaddToolContext) {
  const space_id = input.space_id ?? (await resolveLinkedSpaceId(input.channel_id));
  const thread_id = `chat:${input.channel_id}`;
  const attachment = await uploadBlob({ kind: "file", bytes: decodeBase64Body(input.file_base64), mime: input.mime, prefix: thread_id, filename: input.filename });
  return sendAttachmentMessage(ctx, { space_id, thread_id, message_type: "file", attachment, caption: input.caption, reply_to_id: input.reply_to_id });
}

// ---- Registration ----

export const attachmentTools: MosaddTool[] = [
  {
    name: "mDM_send_voice",
    requires: "network",
    description:
      "Send a VOICE note to a contact as a first-class mDM `voice` message (not a URL stub). Pass audio bytes as base64; the tool uploads to Storage and posts via message-send with the voice attachment descriptor. SCAFFOLD: mDM is client-encrypted — until the seal step ships, bytes are uploaded unsealed (TODO Lane A).",
    inputSchema: mDM_send_voice_input,
    handler: mDM_send_voice as MosaddTool["handler"],
  },
  {
    name: "mDM_send_file",
    requires: "network",
    description:
      "Send a FILE to a contact as a first-class mDM `file` message. Base64 bytes → Storage → message-send file attachment. SCAFFOLD: mDM E2EE seal is TODO (Lane A).",
    inputSchema: mDM_send_file_input,
    handler: mDM_send_file as MosaddTool["handler"],
  },
  {
    name: "mIRC_send_voice",
    requires: "network",
    description: "Send a VOICE note into a persistent channel as a first-class `voice` message. Base64 audio → Storage → message-send (backing space resolved automatically).",
    inputSchema: mIRC_send_voice_input,
    handler: mIRC_send_voice as MosaddTool["handler"],
  },
  {
    name: "mIRC_send_file",
    requires: "network",
    description: "Send a FILE into a persistent channel as a first-class `file` message. Base64 bytes → Storage → message-send.",
    inputSchema: mIRC_send_file_input,
    handler: mIRC_send_file as MosaddTool["handler"],
  },
];
