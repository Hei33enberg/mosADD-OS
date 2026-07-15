import { describe, expect, it } from "vitest";
import { allTools, createMosaddServer } from "../index.js";

describe("@mosadd/mcp", () => {
  describe("allTools registry", () => {
    it("exposes at least the 4 alpha channels", () => {
      const names = allTools.map((t) => t.name);
      // mDM (6 tools)
      expect(names).toContain("mDM_list_contacts");
      expect(names).toContain("mDM_publish_keys");
      expect(names).toContain("mDM_send");
      expect(names).toContain("mDM_send_unencrypted");
      expect(names).toContain("mDM_list");
      expect(names).toContain("mDM_respond_request");
      // mIRC (5 tools)
      expect(names).toContain("mIRC_create");
      expect(names).toContain("mIRC_delete");
      // mURL (revived module) + mAYL (email 3.0, was mp0st) — threat_* re-registered (LINEAR-3498)
      // (surveillance-era direction killed 2026-06-27; on-device security pillar, not an MCP tool)
      expect(names).toContain("mURL_post");
      expect(names).toContain("mAYL_send");
      // mp0st_* remain as deprecated back-compat aliases for mAYL_*
      expect(names).toContain("mp0st_send");
      expect(names).toContain("mp0st_view");
    });

    it("follows RFC 0001 naming — channel tools m<MODULE>_<operation>, meta tools comms_<op>", () => {
      const channelName = /^m[A-Z][A-Z0-9_]*_[a-z][a-z0-9_]*$/;
      const mailName = /^mp0st_[a-z][a-z0-9_]*$/; // mail module codename (LINEAR-3464)
      const metaName = /^comms_[a-z][a-z0-9_]*$/; // discovery/meta namespace
      const threatName = /^threat_[a-z][a-z0-9_]*$/; // defensive threat engine (LINEAR-3498)
      for (const tool of allTools) {
        expect(tool.name).toMatch(
          new RegExp(`${channelName.source}|${mailName.source}|${metaName.source}|${threatName.source}`),
        );
      }
    });

    it("every tool declares a transport requirement (any | radio | network)", () => {
      for (const tool of allTools) {
        expect(["any", "radio", "network"]).toContain(tool.requires);
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
