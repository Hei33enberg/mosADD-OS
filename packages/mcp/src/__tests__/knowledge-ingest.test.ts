/**
 * mRAG_ingest — what actually reaches rag-index.
 *
 * Two things are pinned here, both found by measuring production on 2026-08-14:
 *
 * 1. THE GRAPH FIELDS ARE FORWARDED. The knowledge graph builds its nodes from
 *    metadata.sender / .recipient / .occurred_at and NOTHING else. This tool used to send only a
 *    title, so a corpus could be fully indexed and mRAG_graph_overview still come back empty —
 *    silently, with every call returning success. If these assertions ever go green-but-empty
 *    again, that failure is back.
 *
 * 2. A NON-UUID source_id DOES NOT BLOW UP THE CALL. `user_embeddings.source_id` is a uuid column,
 *    so passing the natural thing (a path, a case number) made the whole ingest fail with an
 *    opaque "rag-index (500): Internal error". Non-UUIDs are folded into a deterministic UUIDv5;
 *    real UUIDs pass through untouched.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const sent: Record<string, unknown>[] = [];

vi.mock("../providers/supabase.js", () => ({
  readSupabaseEnv: () => ({ url: "https://example.supabase.co", anonKey: "anon", userJwt: "jwt" }),
  invokeFunction: (_fn: string, body: Record<string, unknown>) => {
    sent.push(body);
    return Promise.resolve({ indexed: 1, chunk_count: 1 });
  },
}));

const { knowledgeTools } = await import("../tools/knowledge.js");
const ingest = knowledgeTools.find((t) => t.name === "mRAG_ingest")!;
const ctx = { log: () => {} } as never;
const call = (input: Record<string, unknown>) => ingest.handler(input, ctx);
const last = () => sent[sent.length - 1];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("mRAG_ingest", () => {
  beforeEach(() => {
    sent.length = 0;
  });

  it("forwards the parties and the event date as TOP-LEVEL fields (where rag-index reads them)", async () => {
    await call({
      content_text: "Pismo procesowe.",
      sender: { kind: "email", ref: "kancelaria@example.invalid", label: "Kancelaria" },
      recipient: { kind: "unknown", ref: "sad-rejonowy", label: "Sąd Rejonowy" },
      occurred_at: "2019-03-11T10:00:00.000Z",
      direction: "in",
      labels: ["M-01"],
      name: "pozew.pdf",
      mime: "application/pdf",
      size: 1234,
    });
    expect(last()).toMatchObject({
      sender: { kind: "email", ref: "kancelaria@example.invalid" },
      recipient: { kind: "unknown", ref: "sad-rejonowy" },
      occurred_at: "2019-03-11T10:00:00.000Z",
      direction: "in",
      labels: ["M-01"],
      name: "pozew.pdf",
      mime: "application/pdf",
      size: 1234,
    });
  });

  it("keeps caller metadata AND the title, without dropping either", async () => {
    await call({
      content_text: "x",
      title: "Pozew z 11.03.2019",
      metadata: { case_id: "M-01", jurisdiction: "PL", pii_flag: true },
    });
    expect(last().metadata).toMatchObject({
      case_id: "M-01",
      jurisdiction: "PL",
      pii_flag: true,
      title: "Pozew z 11.03.2019",
      ingested_via: "mRAG_ingest",
    });
  });

  it("a caller that passes nothing extra sends the same request shape as before", async () => {
    await call({ content_text: "x", source_type: "note" });
    expect(last()).toEqual({
      source_type: "file", // "note" maps to "file" backend-side, unchanged behaviour
      source_id: null,
      thread_id: null,
      content_text: "x",
      metadata: { ingested_via: "mRAG_ingest" },
    });
  });

  it("folds a non-UUID source_id into a stable uuid and keeps the original visible", async () => {
    await call({ content_text: "x", source_id: "C:/LAW/M-01/pozew.pdf" });
    const id = last().source_id as string;
    expect(id).toMatch(UUID_RE);
    expect(last().metadata).toMatchObject({ source_ref: "C:/LAW/M-01/pozew.pdf" });

    // Deterministic: the same document re-ingested groups with itself rather than forking.
    await call({ content_text: "y", source_id: "C:/LAW/M-01/pozew.pdf" });
    expect(last().source_id).toBe(id);

    // …and a different document does not collide with it.
    await call({ content_text: "z", source_id: "C:/LAW/M-01/odpowiedz.pdf" });
    expect(last().source_id).not.toBe(id);
  });

  it("passes a real UUID through untouched, with no rewrite marker", async () => {
    const uuid = "b228b6ae-dda6-4823-9882-40ea91ed1530";
    await call({ content_text: "x", source_id: uuid });
    expect(last().source_id).toBe(uuid);
    expect(last().metadata).not.toHaveProperty("source_ref");
  });
});
