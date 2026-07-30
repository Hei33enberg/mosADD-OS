import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { TOOL_COUNT } from "../tools/index.js";

// ── Anti-drift gate ──────────────────────────────────────────────────────────
// The advertised tool count has drifted across surfaces repeatedly (68/69/65/61/
// "70+"), which the founder rightly hates. TOOL_COUNT (= allTools.length) is the ONE
// source of truth; every hardcoded doc surface must equal it. If you add/remove a
// tool, this test fails until you update the surfaces below (or vice-versa).
//
// NOT checked here: the mosADD app's LP `McpToolReference` computes its total
// dynamically from the rendered list, so it cannot drift; and the mosadd-agent README
// lives in a separate repo. Both are noted in the migration handoff.
//
// ⚠ CROSS-REPO SURFACE THIS TEST CANNOT REACH: the public MCP server card at
// apps/web/public/.well-known/mcp/server-card.json lives in the m0ssad-3 repo
// (served at mosadd.com/.well-known/mcp/server-card.json). Found 2026-07-30
// advertising 69 AND 64 at once while TOOL_COUNT was 73. It is pinned by its own
// static gate THERE: m0ssad-3 scripts/check-mcp-server-card.mjs (wired into
// scripts/gates-local.mjs), whose EXPECTED_TOOL_COUNT constant must be bumped in
// the same change whenever TOOL_COUNT moves.

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../../.."); // packages/mcp/src/__tests__ -> repo root

const SURFACES: { file: string; re: RegExp; what: string }[] = [
  // README FIRST, because it is the one people actually read. It was NOT in this list until
  // 2026-07-29 — the gate guarded four internal surfaces and left the public face of the project
  // unguarded, which is the wrong way round. The badge is checked because a wrong number in a
  // green badge is the most confident-looking lie a repo can tell.
  { file: "README.md", re: /badge\/tools-(\d+)%20live/, what: "README badge" },
  { file: "README.md", re: /starts an MCP server with \*\*(\d+) tools\*\*/, what: "README intro line" },
  { file: "README.md", re: /\*\*(\d+) callable tools across/, what: "README module breakdown" },
  { file: "README.md", re: /npx -y @mosadd\/mcp@alpha\s+#\s*(\d+) tools/, what: "README quickstart comment" },
  { file: "packages/mcp/server.json", re: /(\d+)\s+MCP tools/, what: "MCP registry manifest description" },
  // The npm-visible description — what `npm view @mosadd/mcp description` and the npmjs.com
  // page show. Added 2026-07-30 (LINEAR-4813): it already said 73 but nothing enforced it.
  { file: "packages/mcp/package.json", re: /—\s*(\d+)\s+tools\s+—/, what: "package.json description" },
  { file: "apps/realm/index.html", re: /#\s*(\d+)\s+tools/, what: "mosadd.dev Realm hero" },
  { file: "apps/dev/app/docs/mcp/page.tsx", re: /Total surface today:[\s\S]*?(\d+)\s+tools/, what: "dev docs /docs/mcp" },
  { file: "apps/dev/app/opengraph-image.tsx", re: /(\d+)\s+MCP tools/, what: "dev OG image" },
];

describe("tool-count consistency (anti-drift gate)", () => {
  it("TOOL_COUNT is a positive integer", () => {
    expect(Number.isInteger(TOOL_COUNT)).toBe(true);
    expect(TOOL_COUNT).toBeGreaterThan(0);
  });

  for (const s of SURFACES) {
    it(`${s.what} (${s.file}) advertises exactly TOOL_COUNT (${TOOL_COUNT})`, () => {
      const txt = readFileSync(resolve(repoRoot, s.file), "utf8");
      const m = txt.match(s.re);
      expect(m, `no tool-count number found in ${s.file} — did the surface change shape?`).toBeTruthy();
      expect(
        Number(m![1]),
        `${s.file} says ${m![1]} tools but TOOL_COUNT is ${TOOL_COUNT} — sync the surface or the registry`,
      ).toBe(TOOL_COUNT);
    });
  }
});
