import type { ChatMessageV1, EnvelopeV1 } from "./messages";
import { z } from "zod";

let _encoder: TextEncoder | null = null;
let _decoder: TextDecoder | null = null;
function getEncoder(): TextEncoder { return _encoder ??= new TextEncoder(); }
function getDecoder(): TextDecoder { return _decoder ??= new TextDecoder(); }
const messageTypeSchema = z.enum(["TEXT", "FILE", "IMAGE", "VOICE_NOTE", "SYSTEM", "EMAIL_FORWARD"]);
const chatMessageSchema = z.object({
  protocol: z.literal("m0ssad.chat.v1"),
  id: z.string(),
  spaceId: z.string(),
  senderAccountId: z.string(),
  timestamp: z.string(),
  encryptedContent: z.string(),
  messageType: messageTypeSchema,
  disappearAfterSeconds: z.number().int().positive().optional()
});
const envelopeSchema = z.object({
  protocol: z.literal("m0ssad.envelope.v1"),
  message: chatMessageSchema,
  signature: z.string().optional()
});

export function encodeChatMessage(message: ChatMessageV1): Uint8Array {
  return getEncoder().encode(JSON.stringify(message));
}

export function decodeChatMessage(payload: Uint8Array): ChatMessageV1 {
  const parsed = JSON.parse(getDecoder().decode(payload));
  return chatMessageSchema.parse(parsed) as ChatMessageV1;
}

export function encodeEnvelope(envelope: EnvelopeV1): Uint8Array {
  return getEncoder().encode(JSON.stringify(envelope));
}

export function decodeEnvelope(payload: Uint8Array): EnvelopeV1 {
  const parsed = JSON.parse(getDecoder().decode(payload));
  return envelopeSchema.parse(parsed) as EnvelopeV1;
}
