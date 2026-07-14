# Vercel AI SDK example

Smallest possible thing that puts mosadd tools in front of a model.

## Run it

```bash
cd examples/vercel-ai
pnpm install

# Required env vars
export OPENAI_API_KEY=sk-...                          # your OpenAI key
export MOSADD_SUPABASE_URL=https://abc.supabase.co    # your mosadd backend
export MOSADD_SUPABASE_ANON_KEY=eyJhbGciOi...
export MOSADD_USER_JWT=eyJhbGciOi...                  # see /examples/claude-code/README.md for how to get this

pnpm start
```

Expected output (when env vars are set):

```
Available tools: mDM_list_contacts, mDM_send, mDM_list, mDM_respond_request, mIRC_create, mIRC_post_message, ...

--- model said ---
I checked your contacts. You have 3 accepted contacts: Alice, Bob, and Carol.

--- tool calls ---
  mDM_list_contacts: {}
```

## What this code shows

```ts
import { mosadd } from "@mosadd/ai/vercel";
import { generateText } from "ai";

const tools = mosadd({ modules: ["mDM", "mIRC"] });

await generateText({
  model: openai("gpt-4o"),
  tools,
  prompt: "...",
});
```

Three lines after the imports. That's the API contract. The model gets 36 tools (14 mDM + 22 mIRC), picks the right one, AI SDK calls `execute()` which routes back through the mosadd handlers via your BYOK Supabase backend.

## Swap to other models

Same `tools` object works with any AI SDK provider:

```ts
import { anthropic } from "@ai-sdk/anthropic";
// or
import { google } from "@ai-sdk/google";
// or
import { mistral } from "@ai-sdk/mistral";

await generateText({ model: anthropic("claude-opus-4-7"), tools, prompt });
```

## Add more channels

```ts
mosadd({ modules: ["mDM", "mIRC", "mURL", "mAYL"] })
// or all
mosadd({})
```

Today: 70+ live tools across the four modules (mDM · mIRC · mURL · mAYL) plus capabilities (mTALK voice, mRAG, comms_).
