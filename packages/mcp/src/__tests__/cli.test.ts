import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { allTools, TOOL_COUNT } from "../tools/index.js";
import { PKG_VERSION } from "../version.js";
import { groupTools, moduleOf, parseCli, renderHelp, renderTools, renderVersion } from "../cli.js";

const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(here, "../../package.json"), "utf8")) as { version: string };

describe("CLI: parseCli", () => {
  it("--version / -v / version print and never serve", () => {
    for (const a of [["--version"], ["-v"], ["version"], ["tools", "--version"]]) expect(parseCli(a).kind).toBe("version");
  });
  it("--help / -h / help print and never serve", () => {
    for (const a of [["--help"], ["-h"], ["help"]]) expect(parseCli(a).kind).toBe("help");
  });
  it("tools lists, auth subcommands keep their args, no args serves", () => {
    expect(parseCli(["tools"]).kind).toBe("tools");
    expect(parseCli(["login", "--email", "a@b.c"])).toEqual({ kind: "auth", sub: "login", rest: ["--email", "a@b.c"] });
    expect(parseCli(["whoami"]).kind).toBe("auth");
    expect(parseCli([]).kind).toBe("serve");
  });
});

describe("CLI: output", () => {
  it("version comes from package.json, not a hand-typed string", () => {
    expect(PKG_VERSION).toBe(pkg.version);
    expect(renderVersion(PKG_VERSION)).toBe(`${pkg.version}\n`);
    expect(renderVersion(PKG_VERSION)).not.toContain("alpha.0");
  });
  it("help lists the commands and MOSADD_API_KEY", () => {
    const h = renderHelp(PKG_VERSION);
    for (const w of ["login", "logout", "whoami", "tools", "--version", "--help", "MOSADD_API_KEY"]) expect(h).toContain(w);
    expect(h).toContain(pkg.version);
  });
  it("tools prints every registered tool exactly once, grouped by module", () => {
    const out = renderTools(allTools);
    expect(out.startsWith(`${TOOL_COUNT} tools in `)).toBe(true);
    for (const t of allTools) expect(out).toContain(`  ${t.name}`);
    const groups = groupTools(allTools);
    expect(groups.reduce((n, g) => n + g.tools.length, 0)).toBe(TOOL_COUNT);
    expect(groups.map((g) => g.module)).toContain("mDM");
    for (const g of groups) for (const t of g.tools) expect(moduleOf(t.name)).toBe(g.module);
  });
});
