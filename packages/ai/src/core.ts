/**
 * @m0ssad/ai/core — internal: shared tool selection and context wiring.
 *
 * All four framework adapters (vercel, langchain, openai, anthropic) call into
 * this module to:
 *   1. Pick which tools to expose (allTools filtered by modules option)
 *   2. Set up the BYOK env vars the handlers expect
 *   3. Hand each adapter a uniform { name, description, inputSchema, handler }
 *      list which it converts into its own framework shape.
 */

import { allTools, type MosaddTool, type MosaddToolContext } from "@m0ssad/mcp";

/** Shared options accepted by every framework adapter. */
export interface MosaddOptions {
  /**
   * Which OS modules to expose. Each module name is the m\* prefix without
   * the underscore — `'mDM'`, `'mROOM'`, etc. Omit to expose ALL shipped
   * tools (17 today, more in follow-ups).
   *
   * Example: `modules: ['mDM', 'mROOM']` exposes only DM + room tools.
   */
  modules?: string[];

  /**
   * BYOK Supabase credentials. If omitted, the handlers read from env vars
   * (M0SSAD_SUPABASE_URL, M0SSAD_SUPABASE_ANON_KEY, M0SSAD_USER_JWT).
   * Passing them programmatically here overrides env for this adapter
   * instance.
   */
  supabase?: {
    url: string;
    anonKey: string;
    userJwt?: string;
  };

  /** Log level passed to the underlying MCP tool context. */
  logLevel?: "debug" | "info" | "warn" | "error";
}

/**
 * Filter the canonical @m0ssad/mcp tools by the user's `modules` selection.
 *
 *   filterTools({})                          // → all shipped tools
 *   filterTools({ modules: ['mDM'] })        // → only mDM_* tools
 *   filterTools({ modules: ['mDM', 'mROOM'] }) // → mDM_* + mROOM_* tools
 */
export function filterTools(options: MosaddOptions = {}): MosaddTool[] {
  if (!options.modules || options.modules.length === 0) {
    return allTools;
  }
  // Convention from RFC 0001: tool names follow `m<MODULE>_<operation>`.
  // Each filter entry matches the prefix `mMODULE_`.
  const prefixes = options.modules.map((m) => `${m}_`);
  return allTools.filter((t) => prefixes.some((p) => t.name.startsWith(p)));
}

/**
 * Build a MosaddToolContext for the handler call site. The MCP server
 * normally builds this; framework adapters need their own so they can route
 * env-based credentials and logging.
 */
export function buildContext(options: MosaddOptions = {}): MosaddToolContext {
  // Set BYOK env vars from the programmatic options if provided. This lets the
  // handler read M0SSAD_SUPABASE_* without the caller having to set them
  // shell-level. Idempotent — only sets if not already there or if caller
  // explicitly passes the field.
  if (options.supabase) {
    if (options.supabase.url) process.env.M0SSAD_SUPABASE_URL = options.supabase.url;
    if (options.supabase.anonKey)
      process.env.M0SSAD_SUPABASE_ANON_KEY = options.supabase.anonKey;
    if (options.supabase.userJwt) process.env.M0SSAD_USER_JWT = options.supabase.userJwt;
  }

  const logLevel = options.logLevel ?? "info";
  const order: Record<"debug" | "info" | "warn" | "error", number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };
  const threshold = order[logLevel];

  return {
    options: { mode: "local", hubUrl: "https://mcp.mosadd.com" },
    log: (level: "debug" | "info" | "warn" | "error", msg: string, extra?: unknown) => {
      if (order[level] >= threshold) {
        process.stderr.write(
          JSON.stringify({ level, msg, extra, ts: new Date().toISOString() }) + "\n",
        );
      }
    },
  };
}

/**
 * Execute a tool by name with parsed input. Returns the handler result or
 * throws an Error the framework wrapper can surface.
 */
export async function invokeMosaddTool(
  toolName: string,
  input: unknown,
  options: MosaddOptions = {},
): Promise<unknown> {
  const tool = allTools.find((t) => t.name === toolName);
  if (!tool) {
    throw new Error(
      `Unknown mosadd tool '${toolName}'. Available: ${allTools.map((t) => t.name).join(", ")}`,
    );
  }
  const ctx = buildContext(options);
  const parsed = tool.inputSchema.parse(input);
  return await tool.handler(parsed as never, ctx);
}
