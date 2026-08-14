/**
 * mRAG — Knowledge Base (RAG): search and reason over the user's own mosadd data.
 *
 * This is the developer-facing surface of the RAG pipeline that already runs
 * inside the mosadd backend: every message/email/call is embedded into a
 * private per-user vector index (rag_embeddings) with hybrid vector + BM25
 * retrieval, Cohere reranking, and a freshness lane for just-sent items. The
 * `mRAG_search` tool lets an AGENT query that index — semantic recall over
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

import { createHash } from "node:crypto";
import { z } from "zod";
import type { MosaddTool, MosaddToolContext } from "../types.js";
import { invokeFunction, readSupabaseEnv } from "../providers/supabase.js";

// ── source_id: free-form for the caller, a UUID on the wire ──────────────────
// `user_embeddings.source_id` is a **uuid** column (measured on prod 2026-08-14). This tool has
// always advertised source_id as "an optional stable id so re-ingests can be grouped" and typed it
// as a plain string — so the natural thing to pass (a file path, a case number, a docket id) made
// the INSERT blow up and the whole call came back as an opaque `rag-index (500): Internal error`.
// Bisected that day: every other field succeeded, `source_id: "bisect-1"` alone failed. It would
// have hit the legal-corpus ingest on document #1, with an error message pointing nowhere.
//
// Rather than push the problem onto every caller ("bring your own UUID"), a non-UUID id is folded
// into a DETERMINISTIC UUIDv5. Same input → same uuid, for ever, so grouping and mRAG_delete keep
// working on natural keys; a caller that already passes a real UUID is untouched. The original
// string is preserved as `metadata.source_ref` so it comes back with search hits and nothing is
// silently renamed behind the user's back.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Fixed namespace for mosadd mRAG source ids. Changing it would orphan every previously grouped source. */
const SOURCE_ID_NAMESPACE = "1f0b6c2e-6a4d-4f7a-9c1e-0b2d3a4f5e6b";

/** RFC 4122 v5 (SHA-1, namespaced). Small enough to keep here rather than add a dependency. */
function uuidV5(name: string, namespace: string): string {
  const ns = Buffer.from(namespace.replace(/-/g, ""), "hex");
  const digest = createHash("sha1").update(Buffer.concat([ns, Buffer.from(name, "utf8")])).digest();
  const b = Buffer.from(digest.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50; // version 5
  b[8] = (b[8] & 0x3f) | 0x80; // RFC 4122 variant
  const h = b.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const mRAG_search_input = z.object({
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
    // ⚠ MUST stay a superset of everything that can REACH the index, or a filter
    // silently hides data the user owns. Until 2026-08-11 this enum was missing
    // "file" and "ptt" while the index held both — `file` is what mRAG_ingest itself
    // writes (it is the DEFAULT source_type, and "note" is mapped onto it), and `ptt`
    // is what mTALK_ingest_ptt writes once a push-to-talk transcript lands. Measured
    // on prod that day: email 4098 · call 233 · note 187 · message 86 · file 49 · ptt 14
    // — i.e. 63 rows were unreachable by any source_types filter. Add a value HERE
    // whenever a new writer starts stamping a new source_type.
    .array(z.enum(["message", "email", "call", "note", "contact", "file", "ptt"]))
    .optional()
    .describe(
      "Restrict retrieval to these source types. Omit to search everything. 'file' covers anything added with mRAG_ingest (its default, and where 'note' ingests land); 'ptt' covers push-to-talk transcripts ingested by mTALK_ingest_ptt.",
    ),
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

async function mRAG_search(
  input: z.infer<typeof mRAG_search_input>,
  ctx: MosaddToolContext,
): Promise<{ answer: string; sources: RagSource[]; chunks_found: number }> {
  readSupabaseEnv();
  ctx.log("debug", "mRAG_search via rag-query", { top_k: input.top_k ?? 8 });

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

/**
 * A person / company / address a document involves.
 *
 * Polymorphic on purpose: mail carries an address, mDM carries an identity UUID, a court filing
 * carries a party name — all three flow through the SAME `{ kind, ref, label }` shape so one
 * filter matches any of them. Mirrors `Party` in the backend's _shared/enrichRagMetadata.ts.
 */
const PartyArg = z.object({
  kind: z
    .enum(["identity", "account", "email", "phone", "url", "unknown"])
    .describe("How to read `ref`: a mosadd identity UUID, an account id, an email address, a phone number, a URL, or a plain name ('unknown')."),
  ref: z
    .string()
    .min(1)
    .max(400)
    .describe("The stable key this party is recognised by — identity UUID, email address, phone number, or the party's canonical name. Use the SAME ref for the same party across documents; that is what merges them into one node in the knowledge graph."),
  label: z.string().max(300).nullish().describe("Human name to display for this party."),
});

const mRAG_ingest_input = z.object({
  content_text: z
    .string()
    .min(1)
    .max(200_000)
    .describe("Text to index into the user's private knowledge base (a note, document, transcript, pasted page…). Chunked + embedded server-side."),
  source_type: z
    .enum(["file", "note", "message", "email", "contact", "call"])
    .optional()
    .describe("What kind of source this is. Default 'file' (a document/note). Use 'note' for ad-hoc text."),
  source_id: z
    .string()
    .max(500)
    .optional()
    .describe(
      "Optional stable id for the source so re-ingests of the SAME document group together (and can be removed later with mRAG_delete). Any string works — a file path, a case number, a checksum: a non-UUID is folded into a stable id derived from it, deterministically, and the original is kept as metadata.source_ref.",
    ),
  thread_id: z.string().optional().describe("Optional thread id to associate this knowledge with (e.g. a dm:/chat: thread)."),
  title: z.string().max(300).optional().describe("Optional human title, stored in metadata."),
  // ── Graph + file-manager fields ────────────────────────────────────────────
  // Added 2026-08-14. The backend (rag-index → enrichRagMetadata) has accepted all of these
  // since 2026-07-19; THIS tool was the only ingest path that dropped them, so everything
  // pushed through MCP landed with no parties and no event date — and therefore contributed
  // NOTHING to mRAG_graph_*, which builds its nodes from exactly these fields. A corpus could
  // be fully indexed and its graph still come back empty. See the note on the tool below.
  sender: PartyArg.optional().describe(
    "Who the document is FROM (author, filing party, sender). Becomes a node in the knowledge graph — without it this document adds no party to mRAG_graph_overview.",
  ),
  recipient: PartyArg.optional().describe(
    "Who the document is TO (addressee, court, counterparty). Becomes a node in the knowledge graph, connected to `sender`.",
  ),
  occurred_at: z
    .string()
    .optional()
    .describe("ISO-8601 timestamp of WHEN the document happened (letter date, filing date, email Date header) — not when you indexed it. Drives mRAG_graph_timeline; defaults to now if omitted, which makes a 2019 filing look like it happened today."),
  direction: z
    .enum(["in", "out", "self"])
    .optional()
    .describe("Direction relative to the account owner: received, sent, or the owner's own note."),
  labels: z
    .array(z.string().max(120))
    .max(50)
    .optional()
    .describe("Free-text tags to attach (e.g. a case id, a jurisdiction) for later filtering."),
  name: z
    .string()
    .max(400)
    .optional()
    .describe("Original filename, if this came from a file (e.g. 'pozew-2019-03-11.pdf'). Its extension is what classifies the row as a document/image/audio in the file view. Distinct from `title`, which is free prose."),
  mime: z.string().max(200).optional().describe("MIME type of the original file, if known."),
  size: z.number().int().nonnegative().optional().describe("Size of the original file in bytes, if known."),
  metadata: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("Any extra fields to store alongside the row (case id, docket number, jurisdiction, file path, checksum, sensitivity flag…). Stored verbatim and returned with search hits. NOTE: this is stored server-side in plaintext like the content itself."),
});

async function mRAG_ingest(
  input: z.infer<typeof mRAG_ingest_input>,
  ctx: MosaddToolContext,
): Promise<{ indexed: number; chunk_count: number }> {
  readSupabaseEnv();
  // rag-index accepts a fixed source_type set; map "note" → "file".
  const backendType = input.source_type === "note" ? "file" : (input.source_type ?? "file");
  ctx.log("debug", "mRAG_ingest via rag-index", {
    source_type: backendType,
    has_parties: Boolean(input.sender || input.recipient),
    has_occurred_at: Boolean(input.occurred_at),
  });
  // The enrichment fields are TOP-LEVEL on the rag-index request, not inside `metadata` — the
  // function destructures them by name and hands them to enrichRagMetadata, which is what stamps
  // metadata.sender / .recipient / .occurred_at in the canonical shape kg_refresh_me reads.
  // Passing them inside `metadata` would land them via `passthrough` and happen to work today,
  // but it would bypass the canonical stamping (and its `sender.ref` validation) — so send them
  // where the contract says they go. Undefined keys are omitted rather than sent as null, so a
  // caller that passes none produces byte-identical requests to before this change.
  const rawSourceId = input.source_id?.trim() || null;
  const sourceId = rawSourceId && !UUID_RE.test(rawSourceId) ? uuidV5(rawSourceId, SOURCE_ID_NAMESPACE) : rawSourceId;
  const data = await invokeFunction<{ indexed?: number; chunk_count?: number }>("rag-index", {
    source_type: backendType,
    source_id: sourceId,
    thread_id: input.thread_id ?? null,
    content_text: input.content_text,
    ...(input.sender ? { sender: input.sender } : {}),
    ...(input.recipient ? { recipient: input.recipient } : {}),
    ...(input.occurred_at ? { occurred_at: input.occurred_at } : {}),
    ...(input.direction ? { direction: input.direction } : {}),
    ...(input.labels?.length ? { labels: input.labels } : {}),
    ...(input.name ? { name: input.name } : {}),
    ...(input.mime ? { mime: input.mime } : {}),
    ...(typeof input.size === "number" ? { size: input.size } : {}),
    metadata: {
      ...(input.metadata ?? {}),
      ...(input.title ? { title: input.title } : {}),
      // Only when we actually rewrote it — a caller that passed a real UUID sees no extra key.
      ...(rawSourceId && rawSourceId !== sourceId ? { source_ref: rawSourceId } : {}),
      ingested_via: "mRAG_ingest",
    },
  });
  return { indexed: data.indexed ?? 0, chunk_count: data.chunk_count ?? 0 };
}

const mRAG_list_sources_input = z.object({});

interface RagSourceEntry {
  source_type: string;
  source_id: string | null;
  thread_id: string | null;
  title: string | null;
  chunks: number;
  first_indexed: string;
  last_indexed: string;
}

async function mRAG_list_sources(
  _input: z.infer<typeof mRAG_list_sources_input>,
  ctx: MosaddToolContext,
): Promise<{ sources: RagSourceEntry[]; total_sources: number; total_chunks: number }> {
  readSupabaseEnv();
  ctx.log("debug", "mRAG_list_sources via rag-sources");
  return await invokeFunction("rag-sources", { action: "list" });
}

const mRAG_delete_input = z
  .object({
    source_id: z.string().optional().describe("Delete every indexed chunk with this source_id (from mRAG_list_sources)."),
    thread_id: z.string().optional().describe("Delete every indexed chunk associated with this thread_id."),
  })
  .refine((v) => v.source_id || v.thread_id, {
    message: "Provide source_id or thread_id — mRAG_delete refuses to purge the whole index.",
  });

async function mRAG_delete(
  input: z.infer<typeof mRAG_delete_input>,
  ctx: MosaddToolContext,
): Promise<{ ok: true; deleted: number; source_id: string | null; thread_id: string | null }> {
  readSupabaseEnv();
  ctx.log("debug", "mRAG_delete via rag-sources", { source_id: input.source_id, thread_id: input.thread_id });
  return await invokeFunction("rag-sources", {
    action: "delete",
    source_id: input.source_id ?? null,
    thread_id: input.thread_id ?? null,
  });
}

export const knowledgeTools: MosaddTool[] = [
  {
    name: "mRAG_ingest",
    requires: "network",
    description:
      "Add text to the USER'S OWN private knowledge base so mRAG_search can recall it later. Pass content_text (a note, document, transcript, pasted page); it is semantically chunked, embedded (1536-d) and stored in the per-user vector index mRAG_search reads. Returns how many chunks were indexed. ⚠ IF YOU ARE INDEXING A CORPUS you want to TRAVERSE (who is connected to whom, when), also pass sender / recipient / occurred_at: the knowledge graph builds its nodes from those fields alone, so documents ingested without them are searchable but contribute NOTHING to mRAG_graph_overview / _neighbors / _timeline — the graph comes back empty however many documents you loaded. Reuse the same party `ref` across documents to merge them into one node. NOTE: indexed content and metadata are stored server-side in plaintext — NOT covered by the zero-knowledge / E2EE guarantee. Only ingest what the user opted to make searchable.",
    inputSchema: mRAG_ingest_input,
    handler: mRAG_ingest as MosaddTool["handler"],
  },
  {
    name: "mRAG_search",
    requires: "network",
    description:
      "Search and answer questions over the USER'S OWN mosadd data (messages, emails, calls, notes) with a private per-user RAG index — hybrid vector + keyword retrieval, reranked, grounded in cited sources (no fabrication). Use it to recall 'what did X say about Y', summarize a thread, or pull facts the user has received. Returns an answer plus the source snippets it used. This is agent memory (mRAG = RAG over your own data) over the user's communications, available outside the mosadd app. NOTE: RAG requires content to be indexed server-side in plaintext, so anything searchable here is NOT covered by the zero-knowledge / E2EE guarantee — only data the user has explicitly opted into indexing is searchable. See docs/security/e2ee-posture.md.",
    inputSchema: mRAG_search_input,
    handler: mRAG_search as MosaddTool["handler"],
  },
  {
    name: "mRAG_list_sources",
    requires: "network",
    description:
      "List what is currently indexed in the user's private knowledge base, grouped by source (source_type, source_id, thread_id, title) with per-source chunk counts and first/last indexed timestamps. Use it to see what mRAG_search can recall, and to find a source_id to remove with mRAG_delete. Owner-scoped.",
    inputSchema: mRAG_list_sources_input,
    handler: mRAG_list_sources as MosaddTool["handler"],
  },
  {
    name: "mRAG_delete",
    requires: "network",
    description:
      "Remove indexed content from the user's knowledge base by source_id or thread_id (from mRAG_list_sources). Deletes every embedded chunk for that source so mRAG_search can no longer recall it. Requires source_id or thread_id (will not purge the whole index). Returns the number of chunks deleted. Owner-scoped.",
    inputSchema: mRAG_delete_input,
    handler: mRAG_delete as MosaddTool["handler"],
  },
];
