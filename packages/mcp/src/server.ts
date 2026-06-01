/**
 * Build a McpServer instance with all mosadd tools registered.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { allTools } from "./tools/index.js";
import { SupabaseDmProvider } from "./providers/supabase-dm.js";
import { SupabaseVoiceProvider } from "./providers/supabase-voice.js";
import { InMemoryMdmKeyStore } from "./crypto/mdm-session.js";
import type { MosaddServerOptions, MosaddToolContext, ProviderRegistry } from "./types.js";

/**
 * Resolve the channel ProviderRegistry: default network adapters merged with
 * anything the host injects. A carrier-aware host (cymru-os) passes its own
 * radio DmProvider via `injected.dm`. This is the single place the default
 * adapters are named — both `createMosaddServer` and the `@mosadd/ai` adapters
 * build their context through it so they stay in lockstep.
 */
export function defaultProviders(injected?: Partial<ProviderRegistry>): ProviderRegistry {
  return {
    dm: injected?.dm ?? new SupabaseDmProvider(),
    keys: injected?.keys ?? new InMemoryMdmKeyStore(),
    voice: injected?.voice ?? new SupabaseVoiceProvider(),
  };
}

export function createMosaddServer(options: MosaddServerOptions = {}) {
  const mode = options.mode ?? (options.apiKey ? "cloud" : "local");
  const hubUrl = options.hubUrl ?? "https://mcp.mosadd.com";
  const logLevel = options.logLevel ?? "info";

  // DI seam: default network adapters, overridden by anything the host injects.
  const providers = defaultProviders(options.providers);

  const ctx: MosaddToolContext = {
    options: { ...options, mode, hubUrl },
    providers,
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
    // MCP SDK v1.x expects the field-level Zod shape (`{ to: z.string(), text: z.string() }`),
    // not the wrapping `z.object({...})`. Tool inputs are declared as ZodObject schemas
    // so we can `.parse()` them in the handler; surface the inner `.shape` to the SDK here.
    const shape =
      tool.inputSchema && typeof tool.inputSchema === "object" && "shape" in tool.inputSchema
        ? (tool.inputSchema as { shape: Record<string, unknown> }).shape
        : (tool.inputSchema as unknown as Record<string, unknown>);

    server.tool(
      tool.name,
      tool.description,
      shape as Parameters<typeof server.tool>[2],
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
