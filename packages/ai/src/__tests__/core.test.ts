import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildContext, filterTools, invokeMosaddTool } from "../core.js";

describe("@mosadd/ai/core", () => {
  describe("filterTools", () => {
    it("returns all tools when no modules specified", () => {
      const all = filterTools({});
      expect(all.length).toBeGreaterThan(10);
    });

    it("filters to a single module prefix", () => {
      const mDMOnly = filterTools({ modules: ["mDM"] });
      expect(mDMOnly.every((t) => t.name.startsWith("mDM_"))).toBe(true);
      expect(mDMOnly.length).toBe(14); // mDM = 14 (text + voice/call + file-send ops)
    });

    it("supports multiple modules", () => {
      const both = filterTools({ modules: ["mDM", "mROOM"] });
      expect(both.length).toBe(14 + 11); // mDM=14, mROOM=11
      expect(
        both.every((t) => t.name.startsWith("mDM_") || t.name.startsWith("mROOM_")),
      ).toBe(true);
    });

    it("returns empty for unknown module", () => {
      const empty = filterTools({ modules: ["mNOPE"] });
      expect(empty).toEqual([]);
    });
  });

  describe("buildContext", () => {
    const savedEnv = { ...process.env };

    beforeEach(() => {
      delete process.env.MOSADD_SUPABASE_URL;
      delete process.env.MOSADD_SUPABASE_ANON_KEY;
      delete process.env.MOSADD_USER_JWT;
    });

    afterEach(() => {
      process.env = { ...savedEnv };
    });

    it("sets BYOK env vars when supabase option provided", () => {
      buildContext({
        supabase: { url: "https://test.supabase.co", anonKey: "anon", userJwt: "jwt" },
      });
      expect(process.env.MOSADD_SUPABASE_URL).toBe("https://test.supabase.co");
      expect(process.env.MOSADD_SUPABASE_ANON_KEY).toBe("anon");
      expect(process.env.MOSADD_USER_JWT).toBe("jwt");
    });

    it("returns a context with log function and options", () => {
      const ctx = buildContext({ logLevel: "warn" });
      expect(typeof ctx.log).toBe("function");
      expect(ctx.options.mode).toBe("local");
      expect(ctx.options.hubUrl).toBe("https://mcp.mosadd.com");
    });
  });

  describe("invokeMosaddTool", () => {
    it("throws for unknown tool", async () => {
      await expect(invokeMosaddTool("mFAKE_op", {}, {})).rejects.toThrow(
        /Unknown mosadd tool/,
      );
    });

    it("validates input schema before dispatching", async () => {
      // mDM_send requires `to` and `text`. Empty input should fail Zod parse.
      await expect(invokeMosaddTool("mDM_send", {}, {})).rejects.toThrow();
    });
  });
});
