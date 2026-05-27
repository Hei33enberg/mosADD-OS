# Anthropic SDK example

Direct Claude tool-use loop with mosadd OS tools.

## Run

```bash
cd examples/anthropic
pnpm install

export ANTHROPIC_API_KEY=sk-ant-...
export M0SSAD_SUPABASE_URL=https://<your>.supabase.co
export M0SSAD_SUPABASE_ANON_KEY=...
export M0SSAD_USER_JWT=...

pnpm start
```

## The canonical Claude tool-use loop

```ts
import Anthropic from "@anthropic-ai/sdk";
import { mosaddTools, executeMosaddToolCall } from "@m0ssad/ai/anthropic";

const client = new Anthropic();
const tools = mosaddTools({ modules: ["mDM", "mROOM"] });

let response = await client.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 1024,
  tools,
  messages: [{ role: "user", content: "..." }],
});

while (response.stop_reason === "tool_use") {
  // find tool_use blocks, run executeMosaddToolCall,
  // append tool_result, loop
}
```

The adapter ships **two functions** for this pattern:

- `mosaddTools(options)` — returns the array Claude's Messages API expects in the `tools` field
- `executeMosaddToolCall(name, input)` — dispatcher to call after Claude returns a `tool_use` block

`index.ts` shows the full loop including error handling (`is_error: true` on tool_result when the handler throws).

## See also

- [`examples/vercel-ai/`](../vercel-ai/) — Vercel AI SDK abstracts the loop for you
- [`packages/ai/README.md`](../../packages/ai/README.md) — full adapter docs across all 4 frameworks
