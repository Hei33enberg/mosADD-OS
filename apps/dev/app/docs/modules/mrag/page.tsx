import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, H3, P, Ul, Pre, Anchor, Callout } from '../../../_components/Prose';

export const metadata: Metadata = {
  title: 'mRAG',
  description: 'Agent memory that links facts across your own data — DMs, calls, emails, notes. RAG today, a fact graph next. Per-tenant, plaintext-by-design, metered.',
};

export default function MragPage() {
  return (
    <Prose>
      <H1>mRAG</H1>
      <Lead>Your agent&apos;s memory — semantic recall that connects facts across everything you feed it: messages, call transcripts, emails, notes.</Lead>

      <P>
        <code className="font-mono text-primary">mRAG</code> gives an agent a private, per-tenant knowledge base:
        store anything, retrieve by meaning, ground answers in your own corpus. Hybrid retrieval (vector + BM25 +
        rerank) runs server-side over content scoped to your key — not a shared index. It&apos;s not a file dump you
        search; it&apos;s memory the agent reasons over.
      </P>

      <Callout type="info">
        <strong>Status: alpha.</strong> Both ends are live: <code className="font-mono">mRAG_ingest</code> (write) and{' '}
        <code className="font-mono">mRAG_search</code> (read) run against the same per-user 1536-dim index. Ingest is
        synchronous — content is searchable as soon as <code className="font-mono">mRAG_ingest</code> returns.
      </Callout>

      <H2>Tools</H2>

      <H3>mRAG_ingest</H3>
      <Pre lang="ts">{`mRAG_ingest({
  content_text: string,     // note, document, transcript, pasted page…
  source_type?: 'file' | 'note' | 'message' | 'email' | 'contact' | 'call',
  source_id?: string,       // group re-ingests
  thread_id?: string,       // associate with a dm:/chat: thread
  title?: string,
})
→ { indexed, chunk_count }  // chunked + embedded server-side`}</Pre>

      <H3>mRAG_search</H3>
      <Pre lang="ts">{`mRAG_search({
  query: string,
  source_types?: ('message'|'email'|'call'|'note'|'contact')[],
  thread_id?: string,       // scope to one thread
  top_k?: number,           // default 8
})
→ {
  answer: string,           // grounded in your data, no fabrication
  sources: [{ source_type, source_id, thread_id, similarity, snippet, created_at }],
  chunks_found: number,
}`}</Pre>

      <H3>mRAG_list_sources</H3>
      <Pre lang="ts">{`mRAG_list_sources({})   // what's indexed, grouped by source
→ {
  sources: [{ source_type, source_id, thread_id, title, chunks, first_indexed, last_indexed }],
  total_sources: number,
  total_chunks: number,
}`}</Pre>

      <H3>mRAG_delete</H3>
      <Pre lang="ts">{`mRAG_delete({
  source_id?: string,       // delete every chunk for this source…
  thread_id?: string,       // …and/or this thread (one is required)
})
→ { ok: true, deleted: number }   // removes it from future mRAG_search. Your own index only.`}</Pre>

      <H2>How it works</H2>
      <Ul>
        <li>Content is chunked and embedded with one pinned 1536-dim model (dimension-validated end to end).</li>
        <li>Retrieval = vector similarity + lexical BM25, fused and reranked, scoped per hub key (tenant-isolated).</li>
        <li>Metered: searches count against your plan (Free 0 · Pro 1k/mo · Team 10k/mo). Text stays free; only the
          paid embedding path bills, with a hard monthly stop so you never overspend.</li>
      </Ul>

      <H2>Where mRAG is going</H2>
      <P>
        Today mRAG is semantic recall over your own corpus. The direction is a <strong>fact graph</strong>: the same
        engine connecting people, threads and events across every surface you feed it — a DM, a voice-call transcript
        and an email about the same thing collapse into one grounded answer with one timeline. Memory that
        <em> links</em> facts and patterns, not just stores files.
      </P>
      <Callout type="info">
        <strong>Honest status:</strong> the retrieval layer (ingest + hybrid search + grounded answers) ships today.
        Entity/relationship linking — the fact-graph layer over retrieval — is the next build, not a current claim.
      </Callout>

      <H2>Posture</H2>
      <P>
        RAG is plaintext server-side by design (the engine must read content to embed it) — opt-in, per-tenant, and
        documented in <Anchor href="/docs/security">/docs/security</Anchor>. It is not part of the E2EE surface.
      </P>

      <P>
        <Anchor href="/docs/mcp">MCP server →</Anchor> · <Anchor href="/docs/modules">← Back to modules</Anchor>
      </P>
    </Prose>
  );
}
