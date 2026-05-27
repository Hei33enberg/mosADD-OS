/**
 * @m0ssad/ai/openai — OpenAI Agents SDK adapter
 *
 * Usage:
 *   import { mosadd } from "@m0ssad/ai/openai";
 *   import { Agent } from "@openai/agents";
 *
 *   const agent = new Agent({
 *     name: "mosadd-helper",
 *     instructions: "You can manage the user's mosadd communications.",
 *     tools: mosadd({ modules: ["mDM", "mROOM"] }),
 *   });
 *
 * Each mosadd tool becomes a `FunctionTool`-shaped entry. The user supplies
 * `@openai/agents` themselves; we don't import it to avoid peer-dep load.
 */

import { buildContext, filterTools, type MosaddOptions } from "../core.js";

/** Shape compatible with `@openai/agents` FunctionTool. */
export interface OpenAICompatibleTool {
  type?: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  strict?: boolean;
  invoke: (args: Record<string, unknown>) => Promise<unknown>;
}

/** Build a list of OpenAI-Agents-compatible tools. */
export function mosadd(options: MosaddOptions = {}): OpenAICompatibleTool[] {
  const tools = filterTools(options);
  const ctx = buildContext(options);

  return tools.map((tool) => ({
    type: "function" as const,
    name: tool.name,
    description: tool.description,
    parameters: zodToJsonSchemaApprox(tool.inputSchema),
    strict: false, // Switch to true after JSON Schema export is exact (v3.0.0-alpha.1).
    invoke: async (args: Record<string, unknown>) => {
      const parsed = tool.inputSchema.parse(args);
      return await tool.handler(parsed as never, ctx);
    },
  }));
}

/**
 * Approximate Zod → JSON Schema. Good enough for OpenAI to inspect parameter
 * names + descriptions in strict=false. v3.0.0-alpha.1 swaps in
 * `zod-to-json-schema` for spec-correct strict mode.
 */
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
