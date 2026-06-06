---
name: mosadd-mrag
description: Search and reason over the user's own mosadd messages, emails, calls, and notes via the RAG knowledge base. Use when the user asks "what did <X> say about <Y>", "summarize my conversations about <topic>", "find emails about <thing>", or "ingest these documents into my knowledge base". NOT for searching the public web (that's a different tool) — mRAG is grounded strictly in the user's indexed mosadd data.
---

# mosadd Knowledge Base (mRAG)

This skill operates the **mRAG** OS module of [mosadd](https://mosadd.dev) — semantic recall over the user's own communications, grounded strictly in their indexed mosadd data. Hybrid vector + BM25 retrieval with Cohere reranking and a freshness lane for just-sent items.

## When to invoke

Trigger on these user intents:
- "What did <contact> say about <topic>?" — `mRAG_search`
- "Summarize my <email/call/DM> threads about <X>" — `mRAG_search`
- "Find the message where I mentioned <X>" — `mRAG_search`
- "Ingest this document into my knowledge base" — `mRAG_ingest`

## How to operate

1. **`mRAG_search` is grounded, not generative.** The tool returns an answer + cited source chunks (`source_type`, `source_id`, `thread_id`, `snippet`, `score`). Never claim something the cited sources don't support; if the answer says "no matching sources", say so plainly to the user — don't fabricate from training data.

2. **Filter by source type when the user is specific.** "What did I email Alice about Q3?" → `source_types: ["email"]`. "Recap my last call with Bob about pricing." → `source_types: ["call"]`. Leave `source_types` empty to search everything.

3. **Top-K is a budget.** `top_k` (default 8, max 25) bounds retrieval depth. For "find the one email where I mentioned X" prefer `top_k: 3`; for "summarize everything about <topic>" go higher.

4. **Use `thread_id` when the user pins a single conversation.** e.g. "Search just my work thread with Alice" → resolve the thread via `mDM_list`, then pass that `thread_id` to `mRAG_search`.

5. **`mRAG_ingest` is for net-new content.** Messages, emails, and calls already-sent are indexed automatically by the mosadd backend. Use `mRAG_ingest` only for external documents/notes the user wants searchable alongside their communications.

6. **Cite sources back to the user.** When you summarize a search result, tell the user which messages/emails/calls back the claim ("from your March 12 email to Bob" / "from yesterday's call with Alice"). The `source_id` + `thread_id` make this exact.

## Configuration

mRAG needs the Supabase backend wired (it queries the same `rag-query` Edge Function that powers in-app RAG):

```
MOSADD_SUPABASE_URL=https://<your-project>.supabase.co
MOSADD_SUPABASE_ANON_KEY=<anon key>
MOSADD_USER_JWT=<your session JWT>
```

On the hosted hub, mRAG is **gated by plan** — Free has RAG off; Pro/Team have it on. BYOK / self-host has no gate; just runs against the user's own backend.

## Example

> **User:** "What did Bob say about pricing in our last call?"
>
> **You:**
> 1. `mRAG_search({ query: "Bob pricing", source_types: ["call"], top_k: 5 })`
> 2. Result: `{ answer: "Bob said the SMB tier should land at $9/mo with a 14-day trial...", sources: [{ source_type: "call", source_id: "call-uuid", thread_id: "call:bob:2026-05-30", snippet: "...pricing for SMBs should be nine dollars...", score: 0.91 }] }`
> 3. Tell the user: "From your May 30 call with Bob: he said the SMB tier should land at $9/mo with a 14-day trial."

## Don't

- Don't claim mRAG results are encrypted — RAG indexes content **plaintext server-side by necessity** (vector search needs the embedding). The user opted in to indexing; the privacy guarantee here is "your own backend", not "zero-knowledge". See [docs/security/e2ee-posture.md](https://github.com/Hei33enberg/mosadd-os/blob/main/docs/security/e2ee-posture.md).
- Don't `mRAG_ingest` random user input as a side effect — only when the user explicitly asks to add something to their knowledge base.
- Don't use mRAG for searching the public web. mRAG is **only** the user's own indexed data.
