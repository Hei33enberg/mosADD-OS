import { describe, expect, it } from "vitest";
import { allTools, createMosaddServer } from "../index.js";

describe("@m0ssad/mcp", () => {
  describe("allTools registry", () => {
    it("exposes at least the 4 alpha channels", () => {
      const names = allTools.map((t) => t.name);
      // mDM (4 tools)
      expect(names).toContain("mDM_list_contacts");
      expect(names).toContain("mDM_send");
      expect(names).toContain("mDM_list");
      expect(names).toContain("mDM_respond_request");
      // mIRC (5 tools)
      expect(names).toContain("mIRC_create");
      expect(names).toContain("mIRC_delete");
      // mROOM (6 tools, including the USP guest-link)
      expect(names).toContain("mROOM_create");
      expect(names).toContain("mROOM_create_guest_link");
      // mAIL (2 tools)
      expect(names).toContain("mAIL_send");
      expect(names).toContain("mAIL_view");
    });

    it("follows RFC 0001 naming — m<MODULE>_<operation>", () => {
      for (const tool of allTools) {
        expect(tool.name).toMatch(/^m[A-Z][A-Z0-9_]*_[a-z][a-z0-9_]*$/);
      }
    });

    it("every tool ships a description and a Zod schema", () => {
      for (const tool of allTools) {
        expect(typeof tool.description).toBe("string");
        expect(tool.description.length).toBeGreaterThan(20);
        expect(tool.inputSchema).toBeDefined();
        // Zod schemas have _def
        expect((tool.inputSchema as { _def?: unknown })._def).toBeDefined();
      }
    });
  });

  describe("createMosaddServer", () => {
    it("constructs without throwing in local mode", () => {
      const server = createMosaddServer({ mode: "local", logLevel: "error" });
      expect(server).toBeDefined();
    });

    it("defaults to local mode when no apiKey", () => {
      const server = createMosaddServer({ logLevel: "error" });
      expect(server).toBeDefined();
    });

    it("accepts cloud mode with apiKey", () => {
      const server = createMosaddServer({ apiKey: "test", logLevel: "error" });
      expect(server).toBeDefined();
    });
  });
});
