/**
 * mRAG_graph — the KNOWLEDGE GRAPH over the user's own mosadd data.
 *
 * mRAG_search recalls WHAT was said; this surface walks WHO/WHAT is connected to whom, and WHEN.
 * The engine already runs inside the mosadd backend as a set of Postgres functions built from the
 * SAME per-user embeddings mRAG_search reads (metadata only — sender/recipient/thread — NEVER the
 * message body, so it does not weaken the E2EE posture). Until now those functions had no MCP door,
 * so an agent could search the corpus but not traverse it. These four tools are that door.
 *
 * ⚠ TRANSPORT: unlike the other mRAG tools (which call Edge Functions via invokeFunction), the
 * graph lives in Postgres RPCs (kg_*), so these call `getSupabase().rpc(...)` directly. The RPCs
 * are `grant execute … to authenticated`, and the graph-building one is SECURITY DEFINER keyed on
 * `auth.uid()`, so under the caller's hub-session JWT every result is scoped to the caller's own
 * account — there is no cross-tenant path.
 *
 * Typical flow for an agent: mRAG_graph_refresh (build/update from the latest ingested data) →
 * mRAG_graph_overview (see the top parties + their ids) → mRAG_graph_neighbors / _timeline on a
 * party id from the overview.
 *
 * Plan note: gated by plan at the hub (the knowledge graph is a paid capability — matches the
 * app's `knowledgeGraph` flag). BYOK/self-host runs it against the user's own backend.
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { getSupabase, readSupabaseEnv } from "../providers/supabase.js";

/** One authenticated RPC round-trip with normalized errors an agent can reason about. */
async function callRpc<T>(fn: string, args: Record<string, unknown>, ctx: MosaddToolContext): Promise<T> {
  readSupabaseEnv();
  ctx.log("debug", `mRAG_graph via ${fn}`, args);
  const { data, error } = await getSupabase().rpc(fn, args);
  if (error) {
    // PostgREST surfaces RLS denials, auth failures and function errors here; hand the agent the
    // real message + code rather than a generic sentence, so it can self-correct.
    throw new Error(`${fn} failed: ${error.message}${error.code ? ` (${error.code})` : ""}`);
  }
  return data as T;
}

// ── mRAG_graph_refresh ───────────────────────────────────────────────────────
const mRAG_graph_refresh_input = z.object({
  max_docs: z
    .number()
    .int()
    .min(1)
    .max(20_000)
    .optional()
    .describe("Cap on source documents scanned when (re)building the graph. Default 20000 (the max)."),
});

async function mRAG_graph_refresh(
  input: z.infer<typeof mRAG_graph_refresh_input>,
  ctx: MosaddToolContext,
): Promise<unknown> {
  // kg_refresh_me rebuilds parties/mentions/edges from the caller's embeddings METADATA only
  // (sender/recipient/thread), never content_text. Returns counts {parties, mentions, edges, …}.
  return await callRpc("kg_refresh_me", { p_max_docs: input.max_docs ?? 20_000 }, ctx);
}

// ── mRAG_graph_overview ──────────────────────────────────────────────────────
const mRAG_graph_overview_input = z.object({
  limit: z.number().int().min(1).max(200).optional().describe("Max parties to return (busiest first). Default 40, max 200."),
});

interface GraphParty {
  party_id: string;
  display_name: string;
  kind: string;
  aliases: string[];
  appearances: number;
  connections: number;
  first_seen_at: string | null;
  last_seen_at: string | null;
}

async function mRAG_graph_overview(
  input: z.infer<typeof mRAG_graph_overview_input>,
  ctx: MosaddToolContext,
): Promise<{ parties: GraphParty[]; count: number }> {
  const rows = await callRpc<GraphParty[]>("kg_overview", { p_limit: input.limit ?? 40 }, ctx);
  const parties = rows ?? [];
  return { parties, count: parties.length };
}

// ── mRAG_graph_neighbors ─────────────────────────────────────────────────────
const mRAG_graph_neighbors_input = z.object({
  party_id: z.string().uuid().describe("The party whose connections to walk (a party_id from mRAG_graph_overview)."),
  depth: z.number().int().min(1).max(2).optional().describe("Hops to walk. Hard-clamped to 2 server-side. Default 1."),
  limit: z.number().int().min(1).max(200).optional().describe("Max neighbours to return. Clamped to 200. Default 50."),
});

interface GraphNeighbor {
  party_id: string;
  display_name: string;
  kind: string;
  depth: number;
  edge_type: string;
  observations: number;
  valid_from: string | null;
  last_seen_at: string | null;
}

async function mRAG_graph_neighbors(
  input: z.infer<typeof mRAG_graph_neighbors_input>,
  ctx: MosaddToolContext,
): Promise<{ neighbors: GraphNeighbor[]; count: number }> {
  const rows = await callRpc<GraphNeighbor[]>(
    "kg_neighbors",
    { p_party_id: input.party_id, p_depth: input.depth ?? 1, p_limit: input.limit ?? 50 },
    ctx,
  );
  const neighbors = rows ?? [];
  return { neighbors, count: neighbors.length };
}

// ── mRAG_graph_timeline ──────────────────────────────────────────────────────
const mRAG_graph_timeline_input = z.object({
  party_id: z.string().uuid().describe("The party whose dated appearance timeline to return (a party_id from mRAG_graph_overview)."),
  limit: z.number().int().min(1).max(200).optional().describe("Max timeline entries (newest first). Clamped to 200. Default 50."),
});

interface GraphTimelineEntry {
  source_type: string;
  source_id: string;
  thread_id: string | null;
  role: string | null;
  occurred_at: string | null;
  evidence_chunk_id: string | null;
}

async function mRAG_graph_timeline(
  input: z.infer<typeof mRAG_graph_timeline_input>,
  ctx: MosaddToolContext,
): Promise<{ timeline: GraphTimelineEntry[]; count: number }> {
  const rows = await callRpc<GraphTimelineEntry[]>(
    "kg_party_timeline",
    { p_party_id: input.party_id, p_limit: input.limit ?? 50 },
    ctx,
  );
  const timeline = rows ?? [];
  return { timeline, count: timeline.length };
}

export const knowledgeGraphTools: MosaddTool[] = [
  {
    name: "mRAG_graph_refresh",
    requires: "network",
    description:
      "(Re)build the USER'S OWN knowledge graph from their indexed data, then return what it found (counts of parties/mentions/edges). Run this first, or after new data has been ingested, so mRAG_graph_overview/neighbors/timeline reflect the latest. Built from METADATA only (who-sent-to-whom, thread membership) — never message bodies, so it does not weaken E2EE. Owner-scoped.",
    inputSchema: mRAG_graph_refresh_input,
    handler: mRAG_graph_refresh as MosaddTool["handler"],
  },
  {
    name: "mRAG_graph_overview",
    requires: "network",
    description:
      "List the parties (people / companies / services) in the user's knowledge graph, busiest first, each with its party_id, kind, aliases, appearance count, connection count and first/last-seen dates. This is the entry point: use a returned party_id with mRAG_graph_neighbors or mRAG_graph_timeline. Owner-scoped.",
    inputSchema: mRAG_graph_overview_input,
    handler: mRAG_graph_overview as MosaddTool["handler"],
  },
  {
    name: "mRAG_graph_neighbors",
    requires: "network",
    description:
      "Walk the connections of one party (from mRAG_graph_overview) — who/what it is linked to, with the edge type, how many times observed, and when. Answers 'who is connected to X, and how'. Depth is hard-clamped to 2 hops and breadth to 200 server-side. Owner-scoped.",
    inputSchema: mRAG_graph_neighbors_input,
    handler: mRAG_graph_neighbors as MosaddTool["handler"],
  },
  {
    name: "mRAG_graph_timeline",
    requires: "network",
    description:
      "Return the dated appearance timeline of one party (from mRAG_graph_overview) — each source (email/message/call/…), its thread, the party's role, and when it occurred, newest first. Answers 'when and where did X show up'. Owner-scoped.",
    inputSchema: mRAG_graph_timeline_input,
    handler: mRAG_graph_timeline as MosaddTool["handler"],
  },
];
