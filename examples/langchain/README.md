# LangChain example

LangChain ReAct agent with mosadd OS tools.

## Run

```bash
cd examples/langchain
pnpm install

export OPENAI_API_KEY=sk-...
export M0SSAD_SUPABASE_URL=https://<your>.supabase.co
export M0SSAD_SUPABASE_ANON_KEY=...
export M0SSAD_USER_JWT=...                  # see /examples/claude-code/README.md

pnpm start
```

## What it shows

```ts
import { mosadd } from "@mosadd/ai/langchain";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

const tools = mosadd({ modules: ["mDM", "mROOM"] }).map(
  (t) => new DynamicStructuredTool(t),
);

const agent = createReactAgent({ llm, tools });
await agent.invoke({ messages: [new HumanMessage("...")] });
```

`@mosadd/ai/langchain` returns plain descriptors — wrap them in `DynamicStructuredTool` (or `StructuredTool` subclass of your choice). Zero peer-dep on LangChain itself; we don't import it.

## See also

- [`examples/vercel-ai/`](../vercel-ai/) — same idea via Vercel AI SDK
- [`packages/ai/README.md`](../../packages/ai/README.md) — full adapter docs
