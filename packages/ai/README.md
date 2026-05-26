# @m0ssad/ai

Framework adapters for mosadd. Single package with subpath exports — one install, all frameworks.

```bash
npm install @m0ssad/ai
```

```ts
import { mosadd } from "@m0ssad/ai/vercel";
import { mosaddTools } from "@m0ssad/ai/langchain";
import { mosaddTools as openaiTools } from "@m0ssad/ai/openai";
import { mosaddTools as anthropicTools } from "@m0ssad/ai/anthropic";
```

Pattern from [Stripe Agent Toolkit](https://github.com/stripe/agent-toolkit). Single version, atomic release.

## Status

Pre-alpha. Stub exports. Real implementations in v3.0.0-alpha.1.

## License

[Apache-2.0](../../LICENSE).
