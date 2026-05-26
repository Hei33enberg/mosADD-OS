/**
 * Internal types for the mosadd MCP server.
 */

import type { z } from "zod";

export type Mode = "cloud" | "local" | "self-host";

export interface MosaddServerOptions {
  /** API key for hosted mode. Required if mode === "cloud". */
  apiKey?: string;
  /** Override the default hub URL (https://mcp.mosadd.com). */
  hubUrl?: string;
  /** Operating mode. Defaults to "cloud" if apiKey is present, else "local". */
  mode?: Mode;
  /** Log level. */
  logLevel?: "debug" | "info" | "warn" | "error";
}

export interface MosaddToolContext {
  options: Required<Pick<MosaddServerOptions, "mode" | "hubUrl">> & MosaddServerOptions;
  /** Per-request logger. */
  log: (level: "debug" | "info" | "warn" | "error", msg: string, extra?: unknown) => void;
}

export interface MosaddTool<TInput = unknown, TOutput = unknown> {
  /** Tool name. MUST follow the m{MODULE}_{operation} convention. */
  name: string;
  /** Short human-readable description. Shown to the model. */
  description: string;
  /** Zod schema for input. */
  inputSchema: z.ZodType<TInput>;
  /** Tool handler. */
  handler: (input: TInput, ctx: MosaddToolContext) => Promise<TOutput>;
}
