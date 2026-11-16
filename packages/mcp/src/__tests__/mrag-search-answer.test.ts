/**
 * mRAG_search `answer` flag — forwarded to rag-query (default false = ranked sources only, no model call).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const sent: Record<string, unknown>[] = [];

vi.mock("../providers/supabase.js", () => ({
  readSupabaseEnv: () => ({ url: "https://example.supabase.co", anonKey: "anon", userJwt: "jwt" }),
  invokeFunction: (_fn: string, body: Record<string, unknown>) => {
    sent.push(body);
    return Promise.resolve({ answer: "", sources: [], chunks_found: 0 });
  },
}));

const { knowledgeTools } = await import("../tools/knowledge.js");
const search = knowledgeTools.find((t) => t.name === "mRAG_search")!;
const ctx = { log: () => {} } as never;
const last = () => sent[sent.length - 1];

describe("mRAG_search answer flag", () => {
  beforeEach(() => {
    sent.length = 0;
  });

  it("defaults to answer:false (sources only)", async () => {
    await search.handler({ query: "co pisal Jan" }, ctx);
    expect(last().answer).toBe(false);
  });

  it("forwards answer:true", async () => {
    await search.handler({ query: "co pisal Jan", answer: true }, ctx);
    expect(last().answer).toBe(true);
  });

  it("the input schema accepts answer and documents it", () => {
    const shape = (search.inputSchema as unknown as { shape: Record<string, { description?: string }> }).shape;
    expect(shape.answer).toBeDefined();
    expect(shape.answer.description).toMatch(/generated answer/);
    expect(search.description).toMatch(/answer:true/);
  });
});
