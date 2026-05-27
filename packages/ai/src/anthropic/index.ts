/**
 * @m0ssad/ai/anthropic — Anthropic SDK / Claude Agent SDK adapter
 *
 * Usage:
 *   import Anthropic from "@anthropic-ai/sdk";
 *   import { mosaddTools, executeMosaddToolCall } from "@m0ssad/ai/anthropic";
 *
 *   const client = new Anthropic();
 *   const tools = mosaddTools({ modules: ["mDM", "mROOM"] });
 *
 *   const response = await client.messages.create({
 *     model: "claude-opus-4-7",
 *     max_tokens: 1024,
 *     tools,
 *     messages,
 *   });
 *
 *   for (const block of response.content) {
 *     if (block.type === "tool_use") {
 *       const result = await executeMosaddToolCall(block.name, block.input);
 *       // append the tool_result block and continue the loop
 *     }
 *   }
 */

import { buildContext, filterTools, type MosaddOptions } from "../core.js";

/** Shape Anthropic's Messages API expects for the `tools` field. */
export interface AnthropicToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

/**
 * Build the tool definitions array for the Anthropic Messages API.
 * Pass directly as the `tools` parameter to `messages.create()`.
 */
export function mosaddTools(options: MosaddOptions = {}): AnthropicToolDefinition[] {
  return filterTools(options).map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: zodToJsonSchemaApprox(tool.inputSchema),
  }));
}

/**
 * Execute a tool call from Claude's response. Pass the `tool_use` block's
 * `name` and `input` straight through; returns the handler result you should
 * surface back as a `tool_result` content block.
 */
export async function executeMosaddToolCall(
  name: string,
  input: unknown,
  options: MosaddOptions = {},
): Promise<unknown> {
  const tool = filterTools(options).find((t) => t.name === name);
  if (!tool) {
    throw new Error(
      `Unknown mosadd tool '${name}'. Did you filter modules and exclude its prefix?`,
    );
  }
  const ctx = buildContext(options);
  const parsed = tool.inputSchema.parse(input);
  return await tool.handler(parsed as never, ctx);
}

function zodToJsonSchemaApprox(schema: unknown): Record<string, unknown> {
  const def = (schema as { _def?: { shape?: () => Record<string, unknown> } })?._def;
  if (!def?.shape) return { type: "object", properties: {} };

  const shape = def.shape();
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, val] of Object.entries(shape)) {
    const innerDef = (val as { _def?: { typeName?: string; description?: string } })?._def;
    properties[key] = {
      type: "string",
      description: innerDef?.description,
    };
    if (!innerDef?.typeName?.includes("Optional")) required.push(key);
  }

  return {
    type: "object",
    properties,
    required,
  };
}

export type { MosaddOptions } from "../core.js";
