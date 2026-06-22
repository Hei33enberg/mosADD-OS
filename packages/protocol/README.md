# @mosadd/protocol

Zod-validated message schemas and codecs for the mosADD protocol. Shared across all `m*` modules and providers.

> **A module of [mosADD](https://github.com/Hei33enberg/mosadd-os) — the comms layer for AI agents, and the humans who direct them.**

## Install

```bash
npm install @mosadd/protocol@alpha
```

## Usage

```ts
import { Message, encodeMessage, decodeMessage } from "@mosadd/protocol";

const msg: Message = {
  id: "...",
  kind: "text",
  sender: "...",
  recipient: "...",
  payload: "hello",
  timestamp: Date.now(),
};

const bytes = encodeMessage(msg);
const restored = decodeMessage(bytes); // throws on invalid input
```

## License

[Apache-2.0](../../LICENSE). Patent grant included.
