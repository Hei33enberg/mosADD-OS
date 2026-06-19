import { describe, expect, it } from "vitest";
import { mosadd as mosaddVercel } from "../vercel/index.js";
import { mosadd as mosaddLangchain } from "../langchain/index.js";
import { mosadd as mosaddOpenAI } from "../openai/index.js";
import { mosaddTools as mosaddAnthropic } from "../anthropic/index.js";

describe("framework adapters", () => {
  describe("@mosadd/ai/vercel", () => {
    it("returns a Record<string, VercelTool> keyed by tool name", () => {
      const tools = mosaddVercel({ modules: ["mDM"] });
      expect(Object.keys(tools)).toContain("mDM_send");
      expect(Object.keys(tools)).toContain("mDM_list_contacts");
      expect(typeof tools.mDM_send?.execute).toBe("function");
      expect(typeof tools.mDM_send?.description).toBe("string");
      expect(tools.mDM_send?.parameters).toBeDefined();
    });

    it("respects module filter", () => {
      const onlyDM = Object.keys(mosaddVercel({ modules: ["mDM"] }));
      expect(onlyDM.every((n) => n.startsWith("mDM_"))).toBe(true);
    });
  });

  describe("@mosadd/ai/langchain", () => {
    it("returns an array of { name, description, schema, func }", () => {
      const tools = mosaddLangchain({ modules: ["mROOM"] });
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBe(9); // mROOM = 7 room ops + 2 message ops
      const create = tools.find((t) => t.name === "mROOM_create_guest_link");
      expect(create).toBeDefined();
      expect(typeof create?.func).toBe("function");
    });
  });

  describe("@mosadd/ai/openai", () => {
    it("returns FunctionTool-shaped descriptors", () => {
      const tools = mosaddOpenAI({ modules: ["mIRC"] });
      expect(tools.length).toBe(20); // mIRC = 5 channel + 10 member + 2 message + 3 edge ops
      for (const t of tools) {
        expect(t.type).toBe("function");
        expect(typeof t.name).toBe("string");
        expect(typeof t.invoke).toBe("function");
        expect(t.parameters).toBeDefined();
        expect(t.parameters.type).toBe("object");
      }
    });
  });

  describe("@mosadd/ai/anthropic", () => {
    it("returns Messages-API-shaped tool definitions", () => {
      const tools = mosaddAnthropic({ modules: ["mp0st"] });
      expect(tools.length).toBe(12); // mp0st: send/list/view/delete/stats/events/metrics/revoke/audit_export/consent/notify/send_as_agent
      for (const t of tools) {
        expect(typeof t.name).toBe("string");
        expect(typeof t.description).toBe("string");
        expect(t.input_schema).toBeDefined();
        expect((t.input_schema as { type?: string }).type).toBe("object");
      }
    });
  });
});
