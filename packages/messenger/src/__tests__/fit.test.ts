import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { fitMessenger, nameFromDescription, scoreTemplates, TEMPLATE_INFO, validateMessenger } from "../index";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "templates");
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
const templates: Record<string, unknown> = {};
for (const f of files) {
  const doc = JSON.parse(readFileSync(join(dir, f), "utf8"));
  templates[doc.template] = doc;
}

describe("niche templates", () => {
  it("ships the two originals and six niches, each registered for the fit", () => {
    expect(Object.keys(templates).sort()).toEqual(TEMPLATE_INFO.map((t) => t.key).sort());
    expect(files).toHaveLength(8);
  });

  for (const f of files) {
    it(`${f} has no errors`, () => {
      const r = validateMessenger(JSON.parse(readFileSync(join(dir, f), "utf8")));
      expect(r.issues.filter((i) => i.level === "error")).toEqual([]);
      // The only template allowed a warning is the one that asks for links that are not shipped yet.
      const warnings = r.issues.filter((i) => i.level === "warning").map((i) => i.code);
      expect(warnings).toEqual(f === "crisis-offline.json" ? ["OFFLINE_EXPERIMENTAL"] : []);
    });
  }

  it("every template has its own id, package and web address", () => {
    const docs = files.map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));
    for (const pick of [(d: any) => d.id, (d: any) => d.releases.android.package, (d: any) => d.releases.web.address, (d: any) => d.theme.id]) {
      expect(new Set(docs.map(pick)).size).toBe(docs.length);
    }
  });
});

describe("fitMessenger", () => {
  const cases: Array<[string, string]> = [
    ["a walkie-talkie for the crew of a port, with an on-duty agent that summarises every shift", "crew-ptt@1"],
    ["radio and incident reports for festival security at the gates", "security-events@1"],
    ["dispatch for our delivery drivers and depot", "logistics-fleet@1"],
    ["big talk button for builders wearing gloves on a construction site", "construction@1"],
    ["a team of ai agents for me, a solo founder", "solo-agents@1"],
    ["messages that work with no internet during a flood, volunteers", "crisis-offline@1"],
    ["a place for parents and teachers of a school class", "school-club@1"],
    ["a running club for our members", "community@1"],
  ];
  for (const [text, key] of cases) {
    it(`"${text.slice(0, 48)}…" → ${key}, and the result validates`, () => {
      const r = fitMessenger(text, templates);
      expect(r.template).toBe(key);
      expect(r.validation.issues.filter((i) => i.level === "error")).toEqual([]);
      expect(r.doc._comment).toBeUndefined();
    });
  }

  it("falls back to the community template when nothing matches", () => {
    const r = fitMessenger("hello", templates);
    expect(r.template).toBe("community@1");
    expect(r.reasons[0]).toContain("default");
  });

  it("takes the name and derives id, namespace, package and address", () => {
    const r = fitMessenger('A radio for a port crew called Port Gdynia Radio', templates);
    expect(r.doc.brand.name).toBe("Port Gdynia Radio");
    expect(r.doc.id).toBe("port-gdynia-radio");
    expect(r.doc.releases.android.package).toBe("org.example.portgdyniaradio");
    expect(r.validation.ok).toBe(true);
  });

  it("refuses the agent when asked, and keeps the layout consistent", () => {
    const r = fitMessenger("a walkie-talkie for a port crew, no agent", templates);
    expect(r.doc.blocks.find((b: any) => b.id === "madd").enabled).toBe(false);
    expect(r.doc.layout.tabs).not.toContain("madd");
    expect(r.validation.ok).toBe(true);
  });

  it("adds an agent to a template that has none, and puts Polish first", () => {
    const r = fitMessenger("no signal, offline messages po polsku with an assistant", templates);
    expect(r.doc.blocks.find((b: any) => b.id === "madd").enabled).toBe(true);
    expect(r.doc.brand.defaultLanguage).toBe("pl");
    expect(r.validation.ok).toBe(true);
  });

  it("scores longer phrases higher and never throws on empty input", () => {
    expect(scoreTemplates("push-to-talk")[0]!.key).toBe("crew-ptt@1");
    expect(() => fitMessenger("", templates)).not.toThrow();
  });

  // Sabotage: a name that claims the engine's brand must come back as an error, not be silently accepted.
  it("TRADEMARK: a mosADD name is reported by the validator", () => {
    const r = fitMessenger("walkie-talkie for a port", templates, { name: "mosADD Radio" });
    expect(r.validation.ok).toBe(false);
    expect(r.validation.issues.map((i) => i.code)).toContain("TRADEMARK");
  });

  it("nameFromDescription reads quotes and 'called'", () => {
    expect(nameFromDescription('make "Dock Talk" for us')).toBe("Dock Talk");
    expect(nameFromDescription("a thing called Harbor Line for crews")).toBe("Harbor Line");
    expect(nameFromDescription("no name here")).toBeUndefined();
  });
});
