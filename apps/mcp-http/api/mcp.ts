// Vercel serverless entrypoint for the hosted MCP gateway (mcp.mosadd.com).
// Thin wrapper around the shared handler — Vercel gives us Node req/res.
import type { IncomingMessage, ServerResponse } from "node:http";
import { handleMcp } from "../src/handler.js";

export const config = { runtime: "nodejs", maxDuration: 60 };

export default async function handler(req: any, res: any): Promise<void> {
  // Vercel auto-parses JSON bodies into req.body; fall back to reading the raw
  // stream if it didn't (e.g. an unusual content-type).
  let body: unknown = req.body;
  if ((body === undefined || body === null) && req.method === "POST") {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const raw = Buffer.concat(chunks).toString("utf8");
    try {
      body = raw ? JSON.parse(raw) : undefined;
    } catch {
      body = undefined;
    }
  }
  await handleMcp(req as IncomingMessage, res as ServerResponse, body);
}
