/**
 * @mosadd/ai/langchain — LangChain adapter
 *
 * Usage:
 *   import { mosadd } from "@mosadd/ai/langchain";
 *   import { DynamicStructuredTool } from "@langchain/core/tools";
 *
 *   const tools = mosadd({ modules: ["mDM"] }).map(
 *     (t) => new DynamicStructuredTool(t),
 *   );
 *
 * Returns plain `{ name, description, schema, func }` descriptors that the
 * user wraps in their LangChain tool class of choice. We don't import
 * `@langchain/*` directly — keeps the peer-dep surface zero.
 */

import { buildContext, filterTools, type MosaddOptions } from "../core.js";

export interface LangChainCompatibleTool {
  /** Tool name following the m<MODULE>_<operation> convention. */
  name: string;
  /** Human-readable description for the model. */
  description: string;
  /** Zod schema. */
  schema: unknown;
  /** Invoke the underlying mosadd handler. */
  func: (input: unknown) => Promise<unknown>;
}

/** Build a list of LangChain-compatible tool descriptors. */
export function mosadd(options: MosaddOptions = {}): LangChainCompatibleTool[] {
  const tools = filterTools(options);
  const ctx = buildContext(options);

  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    schema: tool.inputSchema,
    func: async (input: unknown) => {
      const parsed = tool.inputSchema.parse(input);
      return await tool.handler(parsed as never, ctx);
    },
  }));
}

export type { MosaddOptions } from "../core.js";
