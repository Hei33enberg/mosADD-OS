/**
 * Vercel AI SDK + @mosadd/ai/vercel — minimal walkthrough.
 *
 *   pnpm install
 *   export OPENAI_API_KEY=sk-...
 *   export MOSADD_SUPABASE_URL=https://<your>.supabase.co
 *   export MOSADD_SUPABASE_ANON_KEY=...
 *   export MOSADD_USER_JWT=...
 *   pnpm start
 *
 * What happens:
 *   1. mosadd() returns a tools object keyed by mDM_* / mIRC_* tool names.
 *   2. generateText() asks the model what to do; the model picks a tool;
 *      AI SDK calls execute(); we print the model's final answer.
 *   3. Without MOSADD_* env vars set the tool throws MissingSupabaseEnvError —
 *      that's the alpha BYOK contract.
 */

import { openai } from "@ai-sdk/openai";
import { mosadd } from "@mosadd/ai/vercel";
import { generateText } from "ai";

async function main() {
  const tools = mosadd({
    modules: ["mDM", "mIRC"], // only expose DMs + channels to the model
  });

  console.log("Available tools:", Object.keys(tools).join(", "));

  const { text, toolCalls } = await generateText({
    model: openai("gpt-4o"),
    tools,
    maxSteps: 5,
    system:
      "You operate the user's mosadd communications. When asked to send a message or create a channel, use the tools.",
    prompt:
      "List my mosadd contacts. Don't actually send anything — just check who I can reach.",
  });

  console.log("\n--- model said ---\n" + text);
  if (toolCalls && toolCalls.length > 0) {
    console.log("\n--- tool calls ---");
    for (const call of toolCalls) {
      console.log(`  ${call.toolName}:`, JSON.stringify(call.args));
    }
  }
}

main().catch((err) => {
  console.error("Example failed:");
  console.error(err);
  process.exit(1);
});
