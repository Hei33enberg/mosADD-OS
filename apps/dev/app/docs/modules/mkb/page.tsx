import type { Metadata } from 'next';
import { Prose, H1, Lead, H2, H3, P, Ul, Pre, Anchor, Callout } from '../../../_components/Prose';

export const metadata: Metadata = {
  title: 'mKB',
  description: 'Encrypted knowledge base — semantic recall your agents can read and write. RAG over your own ciphertext.',
};

export default function MkbPage() {
  return (
    <Prose>
      <H1>mKB</H1>
      <Lead>Encrypted knowledge base — semantic recall your agents read and write, over your own ciphertext.</Lead>

      <P>
        <code className="font-mono text-primary">mKB</code> gives an agent a private, per-tenant knowledge base:
        store documents, retrieve by meaning, ground answers in your own corpus. Hybrid retrieval (vector + BM25 +
        rerank) runs server-side over content scoped to your key — not a shared index.
      </P>

      <Callout type="info">
        <strong>Status: alpha.</strong> Both ends are live: <code className="font-mono">mKB_ingest</code> (write) and{' '}
        <code className="font-mono">mKB_search</code> (read) run against the same per-user 1536-dim index. Ingest is
        synchronous — content is searchable as soon as <code className="font-mono">mKB_ingest</code> returns.
      </Callout>

      <H2>Tools</H2>

      <H3>mKB_ingest</H3>
      <Pre lang="ts">{`mKB_ingest({
  content_text: string,     // note, document, transcript, pasted page…
  source_type?: 'file' | 'note' | 'message' | 'email' | 'contact' | 'call',
  source_id?: string,       // group re-ingests
  thread_id?: string,       // associate with a dm:/chat: thread
  title?: string,
})
→ { indexed, chunk_count }  // chunked + embedded server-side`}</Pre>

      <H3>mKB_search</H3>
      <Pre lang="ts">{`mKB_search({
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

      <H2>How it works</H2>
      <Ul>
        <li>Content is chunked and embedded with one pinned 1536-dim model (dimension-validated end to end).</li>
        <li>Retrieval = vector similarity + lexical BM25, fused and reranked, scoped per hub key (tenant-isolated).</li>
        <li>Metered: searches count against your plan (Free 0 · Pro 1k/mo · Team 10k/mo). Text stays free; only the
          paid embedding path bills, with a hard monthly stop so you never overspend.</li>
      </Ul>

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
