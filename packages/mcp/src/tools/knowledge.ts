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
 * Wired to the mosadd backend's `rag-query` Edge Function. The answer + cited sources
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

const mKB_ingest_input = z.object({
  content_text: z
    .string()
    .min(1)
    .max(200_000)
    .describe("Text to index into the user's private knowledge base (a note, document, transcript, pasted page…). Chunked + embedded server-side."),
  source_type: z
    .enum(["file", "note", "message", "email", "contact", "call"])
    .optional()
    .describe("What kind of source this is. Default 'file' (a document/note). Use 'note' for ad-hoc text."),
  source_id: z.string().optional().describe("Optional stable id for the source so re-ingests can be grouped."),
  thread_id: z.string().optional().describe("Optional thread id to associate this knowledge with (e.g. a dm:/chat: thread)."),
  title: z.string().max(300).optional().describe("Optional human title, stored in metadata."),
});

async function mKB_ingest(
  input: z.infer<typeof mKB_ingest_input>,
  ctx: MosaddToolContext,
): Promise<{ indexed: number; chunk_count: number }> {
  readSupabaseEnv();
  // rag-index accepts a fixed source_type set; map "note" → "file".
  const backendType = input.source_type === "note" ? "file" : (input.source_type ?? "file");
  ctx.log("debug", "mKB_ingest via rag-index", { source_type: backendType });
  const data = await invokeFunction<{ indexed?: number; chunk_count?: number }>("rag-index", {
    source_type: backendType,
    source_id: input.source_id ?? null,
    thread_id: input.thread_id ?? null,
    content_text: input.content_text,
    metadata: { ...(input.title ? { title: input.title } : {}), ingested_via: "mKB_ingest" },
  });
  return { indexed: data.indexed ?? 0, chunk_count: data.chunk_count ?? 0 };
}

export const knowledgeTools: MosaddTool[] = [
  {
    name: "mKB_ingest",
    requires: "network",
    description:
      "Add text to the USER'S OWN private knowledge base so mKB_search can recall it later. Pass content_text (a note, document, transcript, pasted page); it is semantically chunked, embedded (1536-d) and stored in the per-user vector index mKB_search reads. Returns how many chunks were indexed. NOTE: indexed content is stored server-side in plaintext — NOT covered by the zero-knowledge / E2EE guarantee. Only ingest what the user opted to make searchable.",
    inputSchema: mKB_ingest_input,
    handler: mKB_ingest as MosaddTool["handler"],
  },
  {
    name: "mKB_search",
    requires: "network",
    description:
      "Search and answer questions over the USER'S OWN mosadd data (messages, emails, calls, notes) with a private per-user RAG index — hybrid vector + keyword retrieval, reranked, grounded in cited sources (no fabrication). Use it to recall 'what did X say about Y', summarize a thread, or pull facts the user has received. Returns an answer plus the source snippets it used. This is agent memory (mKB = knowledge base) over the user's communications, available outside the mosadd app. NOTE: RAG requires content to be indexed server-side in plaintext, so anything searchable here is NOT covered by the zero-knowledge / E2EE guarantee — only data the user has explicitly opted into indexing is searchable. See docs/security/e2ee-posture.md.",
    inputSchema: mKB_search_input,
    handler: mKB_search as MosaddTool["handler"],
  },
];
