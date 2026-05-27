/**
 * @m0ssad/mcp — Model Context Protocol server for mosadd
 *
 * Exposes mosadd OS modules (m*) as MCP tools to any agent runtime
 * (Claude Code, Cursor, Windsurf, Cline, ChatGPT Apps, Lovable, etc.).
 *
 * License: Apache-2.0
 */

export { createMosaddServer } from "./server.js";
export type { MosaddServerOptions, MosaddTool, MosaddToolContext } from "./types.js";
export { allTools } from "./tools/index.js";
