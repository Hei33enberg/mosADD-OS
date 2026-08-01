# @mosadd/protocol

Zod-validated message schemas and codecs for the mosADD protocol. Shared across all `m*` modules and providers.

> **A module of [mosADD](https://github.com/Hei33enberg/mosadd-os) — the comms layer for AI agents, and the humans who direct them.**

## Install

```bash
npm install @mosadd/protocol@alpha
```

## Usage

Verified against the built package (TypeScript shown; drop the two type annotations and it runs as-is under plain Node 18+):

```ts
import {
  encodeChatMessage,
  decodeChatMessage,
  encodeEnvelope,
  decodeEnvelope,
  type ChatMessageV1,
} from "@mosadd/protocol";

const msg: ChatMessageV1 = {
  protocol: "m0ssad.chat.v1", // wire constant — predates the mosADD rename, kept for compatibility
  id: crypto.randomUUID(),
  spaceId: "dm:alice:bob",
  senderAccountId: "alice",
  timestamp: new Date().toISOString(),
  encryptedContent: "<base64 ciphertext>",
  messageType: "TEXT",
};

const bytes = encodeChatMessage(msg); // Uint8Array (UTF-8 JSON)
const restored = decodeChatMessage(bytes); // Zod-validated — throws on invalid input

// Wrap in an envelope for the wire:
const wire = encodeEnvelope({ protocol: "m0ssad.envelope.v1", message: msg });
const envelope = decodeEnvelope(wire);
```

## License

[Apache-2.0](../../LICENSE). Patent grant included.
