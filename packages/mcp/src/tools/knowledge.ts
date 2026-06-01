/**
 * mKB — Knowledge Base (RAG): search and reason over the user's own mosadd data.
 *
 * This is the developer-facing surface of the RAG pipeline that already runs
 * inside the mosadd backend: every message/email/call is embedded into a
 * private per-user vector index (rag_embeddings) with hybrid vector + BM25
 * retrieval, Cohere reranking, and a freshness lane for just-sent items. The
 * `mKB_search` tool lets an AGENT query that index — semantic recall over
 * the user's communications — WITHOUT the mosadd.com app. It is the dev-product
 * form of RAG (decision C): the same engine, exposed as one MCP tool.
 *
 * Wired to the m0ssad-3 `rag-query` Edge Function. The answer + cited sources
 * come back grounded strictly in the user's indexed data (no fabrication).
 *
 * Plan note: on the hosted hub this tool is gated by plan (free = off,
 * pro/team = on); BYOK/self-host runs it against the user's own backend. Gating
 * is enforced at the hub, not in this tool.
 */

import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { invokeFunction, readSupabaseEnv } from "../providers/supabase.js";

const mKB_search_input = z.object({
  query: z
    .string()
    .min(1)
    .max(2_000)
    .describe("Natural-language question to answer from the user's own indexed messages/emails/calls/notes."),
  top_k: z
    .number()
    .int()
    .min(1)
    .max(25)
    .optional()
    .describe("Max number of source chunks to retrieve and ground the answer in. Default 8."),
  source_types: z
    .array(z.enum(["message", "email", "call", "note", "contact"]))
    .optional()
    .describe("Restrict retrieval to these source types. Omit to search everything."),
  thread_id: z
    .string()
    .optional()
    .describe("Optional: restrict retrieval to a single thread id (e.g. a dm:/chat: thread)."),
});

interface RagSource {
  source_type: string;
  source_id: string;
  thread_id: string | null;
  similarity: number;
  snippet: string;
  created_at: string;
}

async function mKB_search(
  input: z.infer<typeof mKB_search_input>,
  ctx: MosaddToolContext,
): Promise<{ answer: string; sources: RagSource[]; chunks_found: number }> {
  readSupabaseEnv();
  ctx.log("debug", "mKB_search via rag-query", { top_k: input.top_k ?? 8 });

  type RagQueryResponse = {
    answer?: string;
    sources?: RagSource[];
    chunks_found?: number;
  };
  const data = await invokeFunction<RagQueryResponse>("rag-query", {
    query: input.query,
    top_k: input.top_k ?? 8,
    source_types: input.source_types ?? null,
    thread_id: input.thread_id ?? null,
  });

  return {
    answer: data.answer ?? "",
    sources: data.sources ?? [],
    chunks_found: data.chunks_found ?? (data.sources?.length ?? 0),
  };
}

export const knowledgeTools: MosaddTool[] = [
  {
    name: "mKB_search",
    requires: "network",
    description:
      "Search and answer questions over the USER'S OWN mosadd data (messages, emails, calls, notes) with a private RAG index — hybrid vector + keyword retrieval, reranked, grounded in cited sources (no fabrication). Use it to recall 'what did X say about Y', summarize a thread, or pull facts the user has received. Returns an answer plus the source snippets it used. This is agent memory (mKB = knowledge base) over the user's communications, available outside the mosadd app.",
    inputSchema: mKB_search_input,
    handler: mKB_search as MosaddTool["handler"],
  },
];
