/**
 * @mosadd/ai/vercel — Vercel AI SDK adapter
 *
 * Usage:
 *   import { mosadd } from "@mosadd/ai/vercel";
 *   import { streamText } from "ai";
 *
 *   const tools = mosadd({ modules: ["mDM", "mIRC"] });
 *   await streamText({ model, tools, messages });
 *
 * Each mosadd tool becomes a Vercel AI SDK `Tool` keyed by its name
 * (`mDM_send`, `mIRC_post_message`, etc.). The handler binds to your
 * mosadd backend via BYOK env vars or the `supabase` option.
 */

import { buildContext, filterTools, type MosaddOptions } from "../core.js";

/** Tool shape compatible with Vercel AI SDK >=4 (`ai` package). */
export interface VercelTool {
  description: string;
  /** Zod schema for parameters — Vercel AI SDK validates against it. */
  parameters: unknown;
  /** Handler invoked when the model calls this tool. */
  execute: (args: unknown) => Promise<unknown>;
}

/**
 * Build a tools object for Vercel AI SDK's `streamText` / `generateText`.
 *
 * Returns `Record<string, VercelTool>` where keys are mosadd tool names
 * (`mDM_send`, `mIRC_create`, ...) and values are Vercel-shaped tools with
 * `description`, `parameters` (Zod schema), and `execute` handler.
 */
export function mosadd(options: MosaddOptions = {}): Record<string, VercelTool> {
  const tools = filterTools(options);
  const ctx = buildContext(options);

  const result: Record<string, VercelTool> = {};

  for (const tool of tools) {
    result[tool.name] = {
      description: tool.description,
      parameters: tool.inputSchema,
      execute: async (args: unknown) => {
        const parsed = tool.inputSchema.parse(args);
        return await tool.handler(parsed as never, ctx);
      },
    };
  }

  return result;
}

export type { MosaddOptions } from "../core.js";
