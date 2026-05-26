/**
 * Build a McpServer instance with all mosadd tools registered.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { allTools } from "./tools/index.js";
import type { MosaddServerOptions, MosaddToolContext } from "./types.js";

export function createMosaddServer(options: MosaddServerOptions = {}) {
  const mode = options.mode ?? (options.apiKey ? "cloud" : "local");
  const hubUrl = options.hubUrl ?? "https://mcp.mosadd.com";
  const logLevel = options.logLevel ?? "info";

  const ctx: MosaddToolContext = {
    options: { ...options, mode, hubUrl },
    log: (level, msg, extra) => {
      if (shouldLog(level, logLevel)) {
        // MCP servers must write logs to stderr (stdout is the protocol channel).
        process.stderr.write(
          JSON.stringify({ level, msg, extra, ts: new Date().toISOString() }) + "\n",
        );
      }
    },
  };

  const server = new McpServer(
    {
      name: "mosadd",
      version: "3.0.0-alpha.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  for (const tool of allTools) {
    server.tool(
      tool.name,
      tool.description,
      // The MCP SDK accepts a Zod schema directly via .shape on object schemas,
      // or a JSON Schema. We pass a thin wrapper that derives the input from the Zod schema.
      // For simplicity in the alpha we forward the raw schema; a follow-up RFC will
      // refine this contract.
      tool.inputSchema as unknown as Parameters<typeof server.tool>[2],
      async (input: unknown) => {
        const parsed = tool.inputSchema.parse(input);
        try {
          const result = await tool.handler(parsed as never, ctx);
          return {
            content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
          };
        } catch (err) {
          ctx.log("error", `tool ${tool.name} failed`, { error: String(err) });
          return {
            isError: true,
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error: err instanceof Error ? err.message : String(err),
                  tool: tool.name,
                }),
              },
            ],
          };
        }
      },
    );
  }

  return server;
}

function shouldLog(level: string, threshold: string): boolean {
  const order = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  return (order[level as keyof typeof order] ?? 1) >= (order[threshold as keyof typeof order] ?? 1);
}
