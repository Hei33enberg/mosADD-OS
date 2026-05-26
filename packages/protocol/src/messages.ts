export type MessageType = "TEXT" | "FILE" | "IMAGE" | "VOICE_NOTE" | "SYSTEM" | "EMAIL_FORWARD";

export interface ChatMessageV1 {
  protocol: "m0ssad.chat.v1";
  id: string;
  spaceId: string;
  senderAccountId: string;
  timestamp: string;
  encryptedContent: string;
  messageType: MessageType;
  disappearAfterSeconds?: number;
}

export interface EnvelopeV1 {
  protocol: "m0ssad.envelope.v1";
  message: ChatMessageV1;
  signature?: string;
}
