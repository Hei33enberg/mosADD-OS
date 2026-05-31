#!/usr/bin/env node
/**
 * `mosadd-mcp` (also runnable as `npx @mosadd/mcp`)
 *
 * Starts a mosadd MCP server over stdio. The standard transport for local
 * MCP clients (Claude Code, Cursor, Cline, Windsurf, Goose, ...).
 *
 * For HTTP/SSE transport (hosted mcp.mosadd.com), see packages/mcp-gateway
 * in the proprietary repo.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMosaddServer } from "../server.js";

async function main(): Promise<void> {
  // Auth subcommands: `mosadd login | logout | whoami`. Everything else starts the server.
  const sub = process.argv[2];
  if (sub === "login" || sub === "logout" || sub === "whoami") {
    const { runAuthCommand } = await import("./login.js");
    await runAuthCommand(sub, process.argv.slice(3));
    return;
  }

  const server = createMosaddServer({
    apiKey: process.env.MOSADD_API_KEY,
    hubUrl: process.env.MOSADD_HUB_URL,
    mode: (process.env.MOSADD_MODE as "cloud" | "local" | "self-host" | undefined),
    logLevel: (process.env.MOSADD_LOG_LEVEL as "debug" | "info" | "warn" | "error" | undefined),
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // The server now runs until stdin closes.
  process.stderr.write(
    JSON.stringify({
      level: "info",
      msg: "mosadd MCP server ready",
      version: "3.0.0-alpha.0",
      ts: new Date().toISOString(),
    }) + "\n",
  );
}

main().catch((err) => {
  process.stderr.write(
    JSON.stringify({
      level: "error",
      msg: "mosadd MCP server failed to start",
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }) + "\n",
  );
  process.exit(1);
});
