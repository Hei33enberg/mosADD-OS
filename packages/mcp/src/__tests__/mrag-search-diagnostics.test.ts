/**
 * mRAG_search diagnostics — what rag-query reports about HOW it found the sources (partial / keyword fallback / per-stage timing)
 * must reach the agent. Before this the handler kept only answer/sources/chunks_found, so a keyword-only fallback after a vector
 * timeout (2026-11-22 incident: 0 sources, "przekroczyło limit czasu") looked identical to an empty memory and no stage time was visible.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

let backend: Record<string, unknown> = {};

vi.mock("../providers/supabase.js", () => ({
  readSupabaseEnv: () => ({ url: "https://example.supabase.co", anonKey: "anon", userJwt: "jwt" }),
  invokeFunction: () => Promise.resolve(backend),
}));

const { knowledgeTools } = await import("../tools/knowledge.js");
const search = knowledgeTools.find((t) => t.name === "mRAG_search")!;
const ctx = { log: () => {} } as never;

const source = { source_type: "file", source_id: "u", thread_id: null, similarity: 0, snippet: "punkt startu", created_at: "2026-11-21T00:00:00Z" };

describe("mRAG_search diagnostics", () => {
  beforeEach(() => {
    backend = {};
  });

  it("keyword fallback after a vector timeout: partial, reason, mode and per-stage timing reach the agent", async () => {
    backend = {
      answer: "[mRAG · wynik częściowy] Etap wektorowy nie zdążył w limicie (3500 ms) — pokazuję wyszukiwanie po słowach: 1 źr.",
      sources: [source],
      chunks_found: 1,
      partial: true,
      partial_reason: "search_timeout",
      search_mode: "keyword",
      timing: { embed_ms: 21, wektor_ms: 3495, slowa_ms: 40, total_ms: 3517 },
      stages: { embed_ms: 21, wektor_ms: 3495, slowa_ms: 40, rerank_ms: null, synteza_ms: null, total_ms: 3517, status: { embed: "ok", wektor: "limit", slowa: "ok" } },
      etapy_tekst: "must not leak into the tool result",
      fresh_chunks: 0,
    };
    const r = (await search.handler({ query: "marocain-punkt-startu" }, ctx)) as Record<string, unknown>;
    expect(r.partial).toBe(true);
    expect(r.partial_reason).toBe("search_timeout");
    expect(r.search_mode).toBe("keyword");
    expect((r.timing as Record<string, number>).wektor_ms).toBe(3495);
    expect(((r.stages as { status: Record<string, string> }).status).wektor).toBe("limit");
    expect(r.chunks_found).toBe(1);
    expect(r.answer).toMatch(/^\[mRAG/);
    // only the documented fields are forwarded, not whatever else the backend happens to send
    expect(Object.keys(r).sort()).toEqual(["answer", "chunks_found", "partial", "partial_reason", "search_mode", "sources", "stages", "timing"]);
  });

  it("a named empty synthesis (degraded) is forwarded together with the sources", async () => {
    backend = { answer: "[mRAG · bez syntezy] Model nie zwrócił odpowiedzi.", sources: [source], chunks_found: 1, degraded: "ai_unavailable", search_mode: "hybrid" };
    const r = (await search.handler({ query: "x", answer: true }, ctx)) as Record<string, unknown>;
    expect(r.degraded).toBe("ai_unavailable");
    expect(r.sources).toHaveLength(1);
  });

  it("an older backend (no diagnostics) yields exactly the old three-field result", async () => {
    backend = { answer: "", sources: [source], chunks_found: 1 };
    const r = (await search.handler({ query: "x" }, ctx)) as Record<string, unknown>;
    expect(Object.keys(r).sort()).toEqual(["answer", "chunks_found", "sources"]);
  });

  it("null diagnostics are dropped, partial:false is kept (it is information)", async () => {
    backend = { answer: "", sources: [], chunks_found: 0, partial: false, degraded: null, timing: null };
    const r = (await search.handler({ query: "x" }, ctx)) as Record<string, unknown>;
    expect(r.partial).toBe(false);
    expect("degraded" in r).toBe(false);
    expect("timing" in r).toBe(false);
  });

  it("the tool description promises exactly what the handler now delivers", () => {
    expect(search.description).toMatch(/partial:true/);
    expect(search.description).toMatch(/partial_reason/);
    expect(search.description).toMatch(/keyword fallback/);
    expect(search.description).toMatch(/timing/);
  });
});
