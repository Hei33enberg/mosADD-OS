import { describe, expect, it } from "vitest";
import { mosadd as mosaddVercel } from "../vercel/index.js";
import { mosadd as mosaddLangchain } from "../langchain/index.js";
import { mosadd as mosaddOpenAI } from "../openai/index.js";
import { mosaddTools as mosaddAnthropic } from "../anthropic/index.js";

describe("framework adapters", () => {
  describe("@m0ssad/ai/vercel", () => {
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

  describe("@m0ssad/ai/langchain", () => {
    it("returns an array of { name, description, schema, func }", () => {
      const tools = mosaddLangchain({ modules: ["mROOM"] });
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBe(8); // mROOM = 6 room ops + 2 message ops
      const create = tools.find((t) => t.name === "mROOM_create_guest_link");
      expect(create).toBeDefined();
      expect(typeof create?.func).toBe("function");
    });
  });

  describe("@m0ssad/ai/openai", () => {
    it("returns FunctionTool-shaped descriptors", () => {
      const tools = mosaddOpenAI({ modules: ["mIRC"] });
      expect(tools.length).toBe(15); // mIRC = 5 channel ops + 10 member ops
      for (const t of tools) {
        expect(t.type).toBe("function");
        expect(typeof t.name).toBe("string");
        expect(typeof t.invoke).toBe("function");
        expect(t.parameters).toBeDefined();
        expect(t.parameters.type).toBe("object");
      }
    });
  });

  describe("@m0ssad/ai/anthropic", () => {
    it("returns Messages-API-shaped tool definitions", () => {
      const tools = mosaddAnthropic({ modules: ["mAIL"] });
      expect(tools.length).toBe(2);
      for (const t of tools) {
        expect(typeof t.name).toBe("string");
        expect(typeof t.description).toBe("string");
        expect(t.input_schema).toBeDefined();
        expect((t.input_schema as { type?: string }).type).toBe("object");
      }
    });
  });
});
