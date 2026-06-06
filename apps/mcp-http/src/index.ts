// Local dev server for the hosted MCP gateway. Run: `npm run dev` (tsx).
// Smoke it like a real MCP HTTP client:
//   curl -s http://localhost:3030/mcp -H 'Authorization: Bearer mosadd_sk_live_…' \
//        -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
//        -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
import { createServer, type IncomingMessage } from "node:http";
import { handleMcp } from "./handler.js";

const PORT = Number(process.env.PORT ?? 3030);

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

const server = createServer(async (req, res) => {
  // Single MCP endpoint at / and /mcp.
  const path = (req.url ?? "/").split("?")[0];
  if (path !== "/" && path !== "/mcp") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not_found" }));
    return;
  }
  const body = req.method === "POST" ? await readBody(req) : undefined;
  try {
    await handleMcp(req, res, body);
  } catch (e) {
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32603, message: (e as Error).message }, id: null }));
    }
  }
});

server.listen(PORT, () => {
  process.stdout.write(`mosadd MCP HTTP gateway listening on http://localhost:${PORT}/mcp\n`);
});
