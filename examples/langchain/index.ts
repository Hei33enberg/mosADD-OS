/**
 * LangChain + @mosadd/ai/langchain — minimal walkthrough.
 *
 *   pnpm install
 *   export OPENAI_API_KEY=sk-...
 *   export MOSADD_SUPABASE_URL=https://<your>.supabase.co
 *   export MOSADD_SUPABASE_ANON_KEY=...
 *   export MOSADD_USER_JWT=...
 *   pnpm start
 *
 * Demonstrates the LangChain adapter pattern:
 *   1. mosadd() returns plain { name, description, schema, func } descriptors
 *   2. We wrap each in DynamicStructuredTool
 *   3. createReactAgent runs the loop
 */

import { ChatOpenAI } from "@langchain/openai";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { mosadd } from "@mosadd/ai/langchain";

async function main() {
  const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });

  const tools = mosadd({ modules: ["mDM", "mIRC"] }).map(
    (t) =>
      new DynamicStructuredTool({
        name: t.name,
        description: t.description,
        // @ts-expect-error — Zod 4 schema, DynamicStructuredTool wants Zod 3 type; runtime works
        schema: t.schema,
        func: async (input: unknown) => JSON.stringify(await t.func(input)),
      }),
  );

  console.log(`Loaded ${tools.length} tools:`);
  for (const t of tools) console.log(`  - ${t.name}`);

  const agent = createReactAgent({ llm, tools });

  const result = await agent.invoke({
    messages: [
      new HumanMessage(
        "List my mosadd contacts. Just call the right tool — don't actually message anyone.",
      ),
    ],
  });

  console.log("\n--- final answer ---\n");
  const last = result.messages[result.messages.length - 1];
  console.log(last.content);
}

main().catch((err) => {
  console.error("Example failed:");
  console.error(err);
  process.exit(1);
});
