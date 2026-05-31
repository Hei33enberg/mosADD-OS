/**
 * Anthropic SDK + @mosadd/ai/anthropic — minimal tool-loop walkthrough.
 *
 *   pnpm install
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *   export M0SSAD_SUPABASE_URL=https://<your>.supabase.co
 *   export M0SSAD_SUPABASE_ANON_KEY=...
 *   export M0SSAD_USER_JWT=...
 *   pnpm start
 *
 * Shows the canonical Claude tool-use loop:
 *   1. messages.create with tools
 *   2. if stop_reason === 'tool_use', dispatch each tool_use block
 *      via executeMosaddToolCall, append tool_result, loop
 *   3. final stop_reason === 'end_turn' — print text content
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  executeMosaddToolCall,
  mosaddTools,
  type AnthropicToolDefinition,
} from "@mosadd/ai/anthropic";

async function main() {
  const client = new Anthropic();

  const tools: AnthropicToolDefinition[] = mosaddTools({
    modules: ["mDM", "mROOM"],
  });

  console.log(`Loaded ${tools.length} tools:`);
  for (const t of tools) console.log(`  - ${t.name}`);

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content:
        "List my mosadd contacts. Don't send anything — just check who I can reach.",
    },
  ];

  for (let step = 0; step < 5; step++) {
    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1024,
      tools,
      messages,
    });

    const assistantContent = response.content;
    messages.push({ role: "assistant", content: assistantContent });

    if (response.stop_reason !== "tool_use") {
      const text = assistantContent.find((b) => b.type === "text");
      console.log("\n--- final answer ---\n" + (text?.type === "text" ? text.text : "(no text)"));
      return;
    }

    // Dispatch each tool_use block, build tool_result blocks for next turn
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of assistantContent) {
      if (block.type !== "tool_use") continue;
      console.log(`→ calling ${block.name}…`);
      try {
        const result = await executeMosaddToolCall(block.name, block.input);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      } catch (err) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify({ error: String(err) }),
          is_error: true,
        });
      }
    }
    messages.push({ role: "user", content: toolResults });
  }

  console.log("Hit max steps without final answer.");
}

main().catch((err) => {
  console.error("Example failed:");
  console.error(err);
  process.exit(1);
});
