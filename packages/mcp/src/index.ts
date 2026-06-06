/**
 * @mosadd/mcp — Model Context Protocol server for mosadd
 *
 * Exposes mosadd OS modules (m*) as MCP tools to any agent runtime
 * (Claude Code, Cursor, Windsurf, Cline, ChatGPT Apps, Lovable, etc.).
 *
 * License: Apache-2.0
 */

export { createMosaddServer, defaultProviders } from "./server.js";
export type {
  MosaddServerOptions,
  MosaddTool,
  MosaddToolContext,
  ProviderRegistry,
} from "./types.js";
export { allTools } from "./tools/index.js";
// Per-request session context for the hosted HTTP gateway (mcp.mosadd.com).
export { runWithSupabaseEnv, type SupabaseEnv } from "./providers/supabase.js";
