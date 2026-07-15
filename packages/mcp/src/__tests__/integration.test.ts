/**
 * Integration test — spawns the actual mcp binary as a child process,
 * sends JSON-RPC over stdin, validates JSON-RPC responses on stdout.
 *
 * Catches regressions like the ZodObject.shape vs ._def.shape() incident
 * (commit c237e86) that unit tests against allTools wouldn't have caught —
 * the bug only surfaces when the MCP SDK's `McpServer.tool(...)` rejects
 * the schema we pass.
 */

import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const MCP_BIN = join(__dirname, "..", "..", "dist", "bin", "mcp.js");

interface JsonRpcMessage {
  jsonrpc: "2.0";
  id?: number | string;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { code: number; message: string };
}

class McpClient {
  private proc!: ChildProcessWithoutNullStreams;
  private buffer = "";
  private resolvers = new Map<number | string, (msg: JsonRpcMessage) => void>();
  private nextId = 1;

  async start(): Promise<void> {
    this.proc = spawn("node", [MCP_BIN], { stdio: ["pipe", "pipe", "pipe"] });

    this.proc.stdout.on("data", (chunk: Buffer) => {
      this.buffer += chunk.toString("utf8");
      let nl = this.buffer.indexOf("\n");
      while (nl !== -1) {
        const line = this.buffer.slice(0, nl).trim();
        this.buffer = this.buffer.slice(nl + 1);
        if (line) {
          try {
            const msg = JSON.parse(line) as JsonRpcMessage;
            if (msg.id !== undefined) {
              const resolve = this.resolvers.get(msg.id);
              if (resolve) {
                this.resolvers.delete(msg.id);
                resolve(msg);
              }
            }
          } catch {
            // server log lines on stderr only; stdout is always JSON-RPC
          }
        }
        nl = this.buffer.indexOf("\n");
      }
    });

    // Wait briefly for the server to be ready (writes a single info log to stderr).
    await new Promise<void>((resolve) => {
      const onData = (chunk: Buffer) => {
        if (chunk.toString("utf8").includes("ready")) {
          this.proc.stderr.off("data", onData);
          resolve();
        }
      };
      this.proc.stderr.on("data", onData);
      setTimeout(resolve, 2000); // hard cap
    });
  }

  async stop(): Promise<void> {
    this.proc.kill();
    await new Promise<void>((resolve) => this.proc.on("close", () => resolve()));
  }

  async send(method: string, params?: unknown, timeoutMs = 5000): Promise<JsonRpcMessage> {
    const id = this.nextId++;
    const req: JsonRpcMessage = { jsonrpc: "2.0", id, method, params };
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.resolvers.delete(id);
        reject(new Error(`MCP request ${method} (id=${id}) timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.resolvers.set(id, (msg) => {
        clearTimeout(timer);
        resolve(msg);
      });
      this.proc.stdin.write(JSON.stringify(req) + "\n");
    });
  }
}

describe("@mosadd/mcp — integration (real stdio)", () => {
  let client: McpClient;

  beforeEach(async () => {
    client = new McpClient();
    await client.start();
  });

  afterEach(async () => {
    await client.stop();
  });

  it("responds to initialize handshake", async () => {
    const resp = await client.send("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "vitest", version: "1.0" },
    });

    expect(resp.error).toBeUndefined();
    const result = resp.result as {
      protocolVersion?: string;
      capabilities?: { tools?: unknown };
      serverInfo?: { name?: string };
    };
    expect(result.protocolVersion).toBe("2024-11-05");
    expect(result.capabilities?.tools).toBeDefined();
    expect(result.serverInfo?.name).toBe("mosadd");
  });

  it("lists all channel tools on tools/list", async () => {
    await client.send("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "vitest", version: "1.0" },
    });

    const resp = await client.send("tools/list");

    expect(resp.error).toBeUndefined();
    const result = resp.result as { tools?: Array<{ name: string }> };
    const names = result.tools?.map((t) => t.name) ?? [];

    // All live channels surface their tools
    expect(names).toContain("mDM_send");
    expect(names).toContain("mIRC_create");
    expect(names).toContain("mURL_post"); // mURL revived module (2026-06-27)
    expect(names).toContain("mAYL_send"); // mAYL = email 3.0 (was mp0st); threat_catalog/threat_classify ARE registered (LINEAR-3498)
    expect(names).toContain("mp0st_send"); // deprecated back-compat alias
    expect(names).toContain("mTALK_press"); // mTALK PTT now shipped
    expect(names).toContain("mRAG_search"); // mRAG RAG-for-devs now shipped
    expect(names).toContain("mIRC_post_message"); // channel messaging now shipped

    // Total tool count today (grows as modules ship)
    expect(names.length).toBeGreaterThanOrEqual(40);

    // Every tool has a valid JSON Schema
    for (const tool of result.tools ?? []) {
      const t = tool as { name: string; description: string; inputSchema: { type?: string } };
      expect(t.description).toBeTruthy();
      expect(t.inputSchema?.type).toBe("object");
    }
  });

  it("returns an error envelope (not crash) when a tool handler throws", async () => {
    await client.send("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "vitest", version: "1.0" },
    });

    // mDM_send needs MOSADD_SUPABASE_URL etc. — in test env we don't have them,
    // so the handler will throw MissingSupabaseEnvError. The MCP layer must wrap
    // that in a normal `isError: true` content block, not a JSON-RPC error
    // (that would crash the agent loop).
    const resp = await client.send("tools/call", {
      name: "mDM_send",
      arguments: { to: "11111111-1111-1111-1111-111111111111", text: "hi" },
    });

    expect(resp.error).toBeUndefined(); // JSON-RPC level OK
    const result = resp.result as { isError?: boolean; content?: Array<{ text?: string }> };
    expect(result.isError).toBe(true);
    expect(result.content?.[0]?.text).toContain("Missing");
  });
});
