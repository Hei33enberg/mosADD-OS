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
        <code className="font-mono text-radar-green">mKB</code> gives an agent a private, per-tenant knowledge base:
        store documents, retrieve by meaning, ground answers in your own corpus. Hybrid retrieval (vector + BM25 +
        rerank) runs server-side over content scoped to your key — not a shared index.
      </P>

      <Callout type="info">
        <strong>Status: alpha.</strong> The <code className="font-mono">mKB_search</code> tool + retrieval engine are
        live; the indexing pipeline is rolling out, so freshly-seeded corpora may return sparse results until indexed.
      </Callout>

      <H2>Tools</H2>

      <H3>mKB_search</H3>
      <Pre lang="ts">{`mKB_search({
  query: string,
  channel_id?: string,    // scope to one space/thread
  top_k?: number,         // default 5
})
→ {
  results: [{ id, score, snippet, source, thread_id }],
  used_queries: number,   // metered against your plan
}`}</Pre>

      <H3>mKB_write <span className="text-muted-foreground">(roadmap)</span></H3>
      <Pre lang="ts">{`mKB_write({
  title: string,
  body: string,           // chunked + embedded server-side
  tags?: string[],
})
→ { doc_id, chunks }`}</Pre>

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
