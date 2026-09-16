// Machine-readable status for the hosted MCP gateway: GET https://mcp.mosadd.com/health
//
// ⛔ WHY: the owner's question „is the gate standing?" used to be answerable only by reading
// free-form HTML, and a cron/monitor had nothing to poll that said "ok" in a parseable way.
// The landing page uses this same endpoint for its live badge, so the two can never disagree.
//
// ⛔ THE TOOL COUNT IS COUNTED, NOT TYPED. `TOOL_COUNT` comes from the published package, i.e.
// from the same registry the connected clients see on `tools/list` — a literal here would
// drift on the next tool and then report a lie with a confident face.
//
// ⛔ NO AUTH: this is a liveness probe and it leaks nothing (no key, no identity, no tenant).
// Anything tenant-shaped must never appear here.
import { TOOL_COUNT } from "@mosadd/mcp";

export const config = { runtime: "nodejs", maxDuration: 10 };

export default async function handler(_req: any, res: any): Promise<void> {
  const sha = (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7);
  const body: Record<string, unknown> = {
    ok: true,
    service: "mcp.mosadd.com",
    tools: TOOL_COUNT,
    transport: "streamable-http",
  };
  if (sha) body.commit = sha;
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify(body));
}
