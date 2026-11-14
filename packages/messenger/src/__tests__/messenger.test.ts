import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  COPY_RULES,
  CURRENT_FORMAT_VERSION,
  MIGRATIONS,
  contrastRatio,
  copyViolations,
  messengerJsonSchema,
  migrateMessenger,
  validateMessenger,
  type Issue,
} from "../index";

const here = dirname(fileURLToPath(import.meta.url));
const pkg = join(here, "..", "..");
const load = (name: string) => JSON.parse(readFileSync(join(pkg, "templates", name), "utf8"));
const codes = (issues: Issue[], level?: Issue["level"]) =>
  issues.filter((i) => !level || i.level === level).map((i) => i.code);
/** A fresh copy of the crew template, changed by `edit`. */
const crew = (edit: (d: any) => void = () => {}) => {
  const d = load("crew-ptt.json");
  edit(d);
  return d;
};

describe("templates", () => {
  for (const name of ["crew-ptt.json", "community.json"]) {
    it(`${name} validates with no errors and no warnings`, () => {
      const r = validateMessenger(load(name));
      expect(r.issues).toEqual([]);
      expect(r.ok).toBe(true);
    });
  }

  it("applies defaults for omitted settings", () => {
    const r = validateMessenger(load("community.json"));
    const mkeeper = r.messenger!.blocks.find((b) => b.id === "mkeeper");
    expect(mkeeper?.settings).toEqual({ jobs: [] });
  });
});

describe("contrast", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    // Port night, measured for the design on 2026-11-14.
    expect(contrastRatio("#e8eef8", "#0b1220")).toBeCloseTo(16.06, 2);
    expect(contrastRatio("#b45309", "#f6f8fb")).toBeCloseTo(4.72, 2);
  });
});

// Every guard below is proven by sabotage: break the template, expect the specific code.
describe("guards (sabotage)", () => {
  it("SHAPE: rejects unknown keys but ignores _comments", () => {
    expect(codes(validateMessenger(crew((d) => (d.brand.colour = "red"))).issues)).toContain("SHAPE");
    expect(validateMessenger(crew((d) => (d.brand._note = "a comment"))).ok).toBe(true);
  });

  it("SHAPE: reports a JSON Pointer path", () => {
    const r = validateMessenger(crew((d) => (d.theme.tokens.dark.text = "white")));
    expect(r.issues[0]).toMatchObject({ level: "error", code: "SHAPE", path: "/theme/tokens/dark/text" });
  });

  it("CONTRAST: blocks a muted text colour below 4.5:1", () => {
    const r = validateMessenger(crew((d) => (d.theme.tokens.light.textMuted = "#9aa3ad")));
    expect(r.ok).toBe(false);
    expect(r.issues.find((i) => i.code === "CONTRAST")?.path).toBe("/theme/tokens/light/textMuted");
  });

  it("CONTRAST: blocks an interface colour below 3:1", () => {
    const r = validateMessenger(crew((d) => (d.theme.tokens.dark.pttListen = "#1b4d2f")));
    expect(codes(r.issues, "error")).toContain("CONTRAST");
  });

  it("TOKENS_MISSING and MODE_NOT_LISTED", () => {
    expect(codes(validateMessenger(crew((d) => delete d.theme.tokens.light)).issues)).toContain("TOKENS_MISSING");
    expect(codes(validateMessenger(crew((d) => (d.theme.modes = ["light"]))).issues)).toContain("MODE_NOT_LISTED");
  });

  it("TAB_NOT_ENABLED and HOME_NOT_IN_TABS", () => {
    const r = validateMessenger(
      crew((d) => {
        d.layout.tabs = ["mtalk", "mayl"];
        d.layout.home = "mirc";
      }),
    );
    expect(codes(r.issues)).toEqual(expect.arrayContaining(["TAB_NOT_ENABLED", "HOME_NOT_IN_TABS"]));
  });

  it("IDENTITY_OFF and IDENTITY_MISSING", () => {
    expect(codes(validateMessenger(crew((d) => (d.blocks[0].enabled = false))).issues)).toContain("IDENTITY_OFF");
    expect(codes(validateMessenger(crew((d) => d.blocks.shift())).issues)).toContain("IDENTITY_MISSING");
  });

  it("BLOCK_DUPLICATE", () => {
    expect(codes(validateMessenger(crew((d) => d.blocks.push({ id: "mayl", enabled: false }))).issues)).toContain("BLOCK_DUPLICATE");
  });

  it("NEEDS_MIRC: push-to-talk in channels without channels", () => {
    const r = validateMessenger(
      crew((d) => {
        d.blocks.find((b: any) => b.id === "mirc").enabled = false;
        d.layout.tabs = ["mtalk", "mdm", "madd"];
      }),
    );
    expect(codes(r.issues, "error")).toEqual(["NEEDS_MIRC"]);
  });

  it("OFFLINE_NEEDS_BUNDLED: no signal needs the client inside the app", () => {
    expect(codes(validateMessenger(crew((d) => (d.releases.android.shell = "remote"))).issues)).toContain("OFFLINE_NEEDS_BUNDLED");
  });

  it("PACKAGE_RESERVED and NO_TARGET", () => {
    expect(codes(validateMessenger(crew((d) => (d.releases.android.package = "com.mosadd.portradio"))).issues)).toContain("PACKAGE_RESERVED");
    const off = crew((d) => {
      d.releases.android.enabled = false;
      d.releases.desktop.enabled = false;
      d.releases.web.enabled = false;
    });
    expect(codes(validateMessenger(off).issues)).toContain("NO_TARGET");
  });

  it("TRADEMARK: the creator's app cannot be named after mosADD", () => {
    for (const name of ["mosADD Port", "Port m0sADD", "MOS ADD radio"]) {
      expect(codes(validateMessenger(crew((d) => (d.brand.name = name))).issues)).toContain("TRADEMARK");
    }
  });

  it("HONESTY: blocks false encryption claims in creator copy", () => {
    const r = validateMessenger(crew((d) => (d.brand.description = "Our crew radio: push-to-talk is end-to-end encrypted.")));
    expect(r.issues.find((i) => i.code === "HONESTY")?.path).toBe("/brand/description");
    const role = validateMessenger(crew((d) => (d.blocks[4].settings.homeAgents[0].role = "A zero-knowledge assistant")));
    expect(codes(role.issues)).toContain("HONESTY");
  });

  it("HONESTY: allows the true sentence", () => {
    const r = validateMessenger(crew((d) => (d.brand.description = "Direct messages between two people are end-to-end encrypted.")));
    expect(r.ok).toBe(true);
  });

  it("warnings never block a release", () => {
    const r = validateMessenger(
      crew((d) => {
        d.releases.android.push = "fcm";
        d.instance.network.listedInMosaddDirectory = true;
      }),
    );
    expect(r.ok).toBe(true);
    expect(codes(r.issues, "warning")).toEqual(expect.arrayContaining(["PUSH_FCM", "DIRECTORY_PLANNED"]));
  });
});

describe("copy rules", () => {
  it.each(COPY_RULES.map((r) => [r.sample, r]))("flags its own sample: %s", (sample, rule) => {
    expect(copyViolations(sample as string)).toContain(rule);
  });
});

describe("migrations", () => {
  it("passes the current version through", () => {
    expect(migrateMessenger(load("crew-ptt.json"))).toMatchObject({ ok: true, from: 1, to: CURRENT_FORMAT_VERSION });
  });

  it("refuses a future version with FORMAT_TOO_NEW", () => {
    const r = validateMessenger(crew((d) => (d.formatVersion = CURRENT_FORMAT_VERSION + 1)));
    expect(r.issues).toEqual([expect.objectContaining({ code: "FORMAT_TOO_NEW", path: "/formatVersion" })]);
  });

  it("has a step for every older version", () => {
    for (let v = 1; v < CURRENT_FORMAT_VERSION; v++) expect(MIGRATIONS[v]).toBeTypeOf("function");
  });
});

describe("published JSON Schema", () => {
  it("matches schema/messenger-1.json (run `pnpm build && pnpm schema` after changing the Zod schema)", () => {
    const committed = JSON.parse(readFileSync(join(pkg, "schema", "messenger-1.json"), "utf8"));
    expect(messengerJsonSchema()).toEqual(committed);
  });
});
