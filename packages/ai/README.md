# @mosadd/ai

Framework adapters for [mosadd](https://mosadd.dev) — use the 52 mosadd OS tools directly from your favorite agent framework without spinning up the MCP server.

**One package, four entrypoints, atomic releases** — pattern stolen from [Stripe Agent Toolkit](https://github.com/stripe/agent-toolkit).

| Subpath | Framework | What you get |
|---|---|---|
| `@mosadd/ai/vercel` | [Vercel AI SDK](https://sdk.vercel.ai) (`ai` package, v4+) | `Record<string, VercelTool>` for `streamText` / `generateText` |
| `@mosadd/ai/langchain` | [LangChain](https://js.langchain.com) | Plain descriptors you wrap in `DynamicStructuredTool` |
| `@mosadd/ai/openai` | [OpenAI Agents SDK](https://github.com/openai/openai-agents-js) | `FunctionTool[]` for the `tools:` array on `Agent` |
| `@mosadd/ai/anthropic` | [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) | `[{ name, description, input_schema }]` for Messages API |

## Vercel AI SDK

```ts
import { mosadd } from "@mosadd/ai/vercel";
import { streamText } from "ai";

const tools = mosadd({
  modules: ["mDM", "mROOM"],
  supabase: {
    url: process.env.MOSADD_SUPABASE_URL!,
    anonKey: process.env.MOSADD_SUPABASE_ANON_KEY!,
    userJwt: process.env.MOSADD_USER_JWT!,
  },
});

await streamText({ model: openai("gpt-5"), tools, messages });
```

## LangChain

```ts
import { mosadd } from "@mosadd/ai/langchain";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

const tools = mosadd({ modules: ["mDM"] }).map(
  (t) => new DynamicStructuredTool(t),
);

const agent = createReactAgent({ llm, tools });
```

## OpenAI Agents SDK

```ts
import { mosadd } from "@mosadd/ai/openai";
import { Agent, run } from "@openai/agents";

const agent = new Agent({
  name: "mosadd-helper",
  instructions: "Manage the user's mosadd communications when asked.",
  tools: mosadd({ modules: ["mDM", "mROOM", "mAIL"] }),
});

await run(agent, "Send Alice a message saying I'll be late.");
```

## Anthropic SDK / Claude Agent SDK

```ts
import Anthropic from "@anthropic-ai/sdk";
import { mosaddTools, executeMosaddToolCall } from "@mosadd/ai/anthropic";

const client = new Anthropic();
const tools = mosaddTools({ modules: ["mDM", "mROOM"] });

let response = await client.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 1024,
  tools,
  messages: [{ role: "user", content: "Send Bob a guest room link valid 1h." }],
});

while (response.stop_reason === "tool_use") {
  // … find tool_use blocks, run executeMosaddToolCall, append tool_result, loop …
}
```

## Options

```ts
interface MosaddOptions {
  /** Filter to specific m* modules. Defaults to ALL shipped tools. */
  modules?: string[];

  /** BYOK Supabase creds. Falls back to env vars if omitted. */
  supabase?: {
    url: string;
    anonKey: string;
    userJwt?: string;
  };

  /** Log level. */
  logLevel?: "debug" | "info" | "warn" | "error";
}
```

If `supabase` is omitted, the adapters read from env:
- `MOSADD_SUPABASE_URL`
- `MOSADD_SUPABASE_ANON_KEY`
- `MOSADD_USER_JWT`

## What you don't get

This adapter pack stays minimal on purpose:

- **No peer deps** on `ai`, `@langchain/*`, `@openai/agents`, or `@anthropic-ai/sdk`. We return shapes those packages happen to accept. The consumer brings the framework.
- **No HTTP transport.** Adapters call the mosadd handlers directly in-process. For HTTP/SSE use the MCP server — see [`packages/mcp`](../mcp).
- **Strict JSON Schema** for OpenAI/Anthropic is approximate today (`strict: false`). v3.0.0-alpha.1 brings exact mode via `zod-to-json-schema`.

## License

Apache-2.0. See [LICENSE](../../LICENSE).
