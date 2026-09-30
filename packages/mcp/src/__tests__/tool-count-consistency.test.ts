import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { TOOL_COUNT, allTools } from "../tools/index.js";

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
  // README rewritten 2026-09-29 (m.0S truth pass): the badge, the @alpha quickstart line and the long module
  // table are gone; the two sentences that carry the total are pinned instead.
  { file: "README.md", re: /^(\d+) tools in `@mosadd\/mcp`/m, what: "README tools section" },
  { file: "packages/mcp/server.json", re: /(\d+)\s+MCP tools/, what: "MCP registry manifest description" },
  // The npm-visible description — what `npm view @mosadd/mcp description` and the npmjs.com
  // page show. Added 2026-07-30 (LINEAR-4813): it already said 73 but nothing enforced it.
  { file: "packages/mcp/package.json", re: /—\s*(\d+)\s+tools\s+—/, what: "package.json description" },
  // Added 2026-08-01 (content-truth audit, LINEAR-5057 E-17): six surfaces the gate did
  // not pin had silently drifted to 69/66/71/22/4 while TOOL_COUNT was 73. Every public
  // file that hand-types a total is now listed here — if you add a surface with a
  // number, add it to this array in the same PR.
  { file: "packages/ai/README.md", re: /the (\d+) mosADD toolkit tools/, what: "@mosadd/ai README" },
  { file: "docs/architecture/human-os.md", re: /exposing \*\*(\d+) tools\*\*/, what: "human-os architecture doc" },
  { file: "examples/README.md", re: /\*\*(\d+) live MCP tools across/, what: "examples README header" },
  { file: "packages/mcp/README.md", re: /One key, one server, (\d+) tools/, what: "@mosadd/mcp README intro" },
  { file: "packages/mcp/README.md", re: /\*\*(\d+) callable tools\*\* in total/, what: "@mosadd/mcp README breakdown" },
  // Added 2026-09-04 (kanon 1.1 review, LINEAR-5870): three more public files hand-typed a total
  // and had sat at 77 through two bumps (82, 84) because nothing pinned them. Both realm llms.txt
  // lines are pinned separately — a single /(\d+) tools/ would only ever see the first.
  // The package's own number, 85 on 2026-09-29, pinned where a text describes @mosadd/mcp itself.
];

// ── The HUB's number ────────────────────────────────────────────────────────
// 2026-09-29 (verifier of the m.0S distribution pass): the public texts said "85 tools" for
// https://mcp.mosadd.dev/mcp while the hub listed 88 — it serves every @mosadd/mcp tool plus tools of its
// own. 2026-09-30: the hub lists 86, because the phone-call tools (call_start, call_status) are held back until
// calls open (the price list marks them "soon"); the count moved 85 → 88 → 86 in two days. So texts about the
// ENDPOINT carry no number at all: they point at distribution/hub-tools.json (a snapshot of the live tools/list;
// `node scripts/check-hub-tools.mjs` compares it with the live hub, `--write` refreshes it), and this gate fails
// when one of them states "<N> tools" for the endpoint again. A number that describes @mosadd/mcp itself (a line
// that names `@mosadd/mcp`) stays and is pinned to TOOL_COUNT by SURFACES above.
const hubSnapshot = JSON.parse(readFileSync(resolve(repoRoot, "distribution/hub-tools.json"), "utf8")) as {
  count: number;
  names: string[];
  server_version: string;
};
const packageNames = allTools.map((t) => t.name);
const HUB_ONLY = hubSnapshot.names.filter((n) => !packageNames.includes(n)).sort();
const HUB_COUNT = hubSnapshot.count;
const HELD_BACK = ["call_start", "call_status"]; // phone calls through the user's own Telnyx/Twilio account: "soon"

// Every public text that talks about the endpoint (not about the package).
const HUB_TEXTS = [
  "README.md",
  "docs/hosts.md",
  "docs/roadmap.md",
  "skills/m0s-quickstart/SKILL.md",
  "distribution/clawhub/m0s/SKILL.md",
  "distribution/pulsemcp.md",
  "distribution/mcp-so.md",
  "distribution/awesome-mcp-servers.md",
];
/** "88 tools", "88 MCP tools", "88 live tools" — a fixed count, in a line that is not about @mosadd/mcp. */
const FIXED_COUNT = /\b\d+\s+(?:MCP\s+|live\s+|callable\s+)?tools\b/i;
function fixedHubCounts(text: string): string[] {
  return text.split(/\r?\n/).filter((l) => FIXED_COUNT.test(l) && !l.includes("@mosadd/mcp"));
}

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

describe("hub tool count (texts about https://mcp.mosadd.dev/mcp)", () => {
  it("the snapshot is the package plus the hub's own tools, nothing missing", () => {
    expect(hubSnapshot.names).toHaveLength(hubSnapshot.count);
    expect(packageNames.filter((n) => !hubSnapshot.names.includes(n)), "package tools the hub does not list").toEqual([]);
    expect(HUB_COUNT).toBe(TOOL_COUNT + HUB_ONLY.length);
  });

  it("the README tools section points at the snapshot, names every hub-only tool and says which are held back", () => {
    const readme = readFileSync(resolve(repoRoot, "README.md"), "utf8");
    const para = readme.match(/[^\n]*distribution\/hub-tools\.json[^\n]*(?:\n(?!\n)[^\n]*)*/)?.[0] ?? "";
    expect(para, "README has no paragraph pointing at distribution/hub-tools.json").not.toBe("");
    for (const n of HUB_ONLY) expect(para, `README hub paragraph does not name ${n}`).toContain(`\`${n}\``);
    const listed = HELD_BACK.filter((n) => hubSnapshot.names.includes(n));
    if (listed.length === 0) {
      // calls are not open: the README must say so, and name the tools it holds back
      expect(para).toMatch(/coming soon/);
      expect(para).toMatch(/held back/);
      for (const n of HELD_BACK) expect(para, `README does not name the held-back ${n}`).toContain(`\`${n}\``);
    } else {
      expect(para, `the hub lists ${listed.join(", ")} now — the README still says they are held back`).not.toMatch(/held back/);
    }
  });

  for (const file of HUB_TEXTS) {
    it(`${file} states no fixed number of hub tools (it points at distribution/hub-tools.json)`, () => {
      const lines = fixedHubCounts(readFileSync(resolve(repoRoot, file), "utf8"));
      expect(
        lines,
        `${file} states a fixed tool count for the endpoint (the hub lists ${HUB_COUNT} today, and it changes): drop the number or point at distribution/hub-tools.json`,
      ).toEqual([]);
    });
  }

  it("the gate fires: a text that says '88 tools' for the endpoint is caught, one about @mosadd/mcp is not", () => {
    expect(fixedHubCounts("m.0S is a hosted MCP endpoint with 88 tools.")).toHaveLength(1);
    expect(fixedHubCounts("The hub lists **88 MCP tools** today.")).toHaveLength(1);
    expect(fixedHubCounts("85 tools in `@mosadd/mcp` (`3.0.0-alpha.55`)")).toEqual([]);
    expect(fixedHubCounts("The hub's tool list is whatever `tools/list` returns.")).toEqual([]);
  });
});

// ── Per-MODULE anti-drift gate ───────────────────────────────────────────────
// WHY this exists (added 2026-08-11): the total-only gate above was GREEN while the
// prose around every pinned line was wrong. Each SURFACES entry pins ONE regex per
// file, so somebody could correct the single matched number and leave its own sentence
// contradicting it. Measured that day, with TOOL_COUNT = 77:
//   - packages/mcp/README.md ended a sentence "**77 callable tools** in total" (pinned,
//     green) whose own terms — mDM 14 + mIRC 24 + mURL 7 + mAYL 12 = 57, +16 — summed
//     to 73, because mAYL had grown by the four mAYL_agentbox_* tools and nobody
//     re-added the addends.
//   - src/tools/index.ts said the same thing in its header comment.
// A breakdown that contradicts its own total is worse than no breakdown: it looks
// audited. So the addends are now derived from allTools and pinned too.
const liveByModule: Record<string, number> = (() => {
  const by: Record<string, number> = {};
  for (const t of allTools) {
    // Prefix = everything before the first "_", except comms_*/threat_* which are
    // capability groups rather than m* modules and are labelled as such in the docs.
    const prefix = t.name.startsWith("comms_")
      ? "comms"
      : t.name.startsWith("threat_")
        ? "threat"
        : t.name.split("_")[0];
    by[prefix] = (by[prefix] ?? 0) + 1;
  }
  return by;
})();

/** Doc label → the registry prefix it describes. "Irondome" is the brand name for threat_*. */
const MODULE_LABELS: { label: string; prefix: string }[] = [
  { label: "mDM", prefix: "mDM" },
  { label: "mIRC", prefix: "mIRC" },
  { label: "mURL", prefix: "mURL" },
  { label: "mAYL", prefix: "mAYL" },
  { label: "mTALK", prefix: "mTALK" },
  { label: "mRAG", prefix: "mRAG" },
];

const MODULE_SURFACES: { file: string; what: string; re: (label: string) => RegExp }[] = [
  {
    file: "packages/mcp/src/tools/index.ts",
    what: "registry header breakdown",
    // "modules mDM 14 · mIRC 24 · mURL 7 · mAYL 16 = 61; capabilities mTALK 6 · mRAG 4 …"
    re: (label) => new RegExp(`\\b${label}\\s+(\\d+)\\s*[·=]`),
  },
  {
    file: "packages/mcp/README.md",
    what: "README module table row",
    // "| **mDM** (14) | `mDM_list_contacts`, …"
    re: (label) => new RegExp(`\\|\\s*\\*\\*${label}\\*\\*\\s*\\((\\d+)\\)`),
  },
  {
    file: "packages/mcp/README.md",
    what: "README breakdown addends",
    // "mDM (14) + mIRC (24) + … ; capabilities: mTALK (6) + mRAG (4) + …"
    re: (label) => new RegExp(`\\b${label}_?\\s*\\((\\d+)\\)\\s*[+=;]`),
  },
  // Added 2026-09-04 (kanon 1.1 review, LINEAR-5870). Measured that day: examples/README.md had
  // its header bumped to 85 while its own addends still read mDM (14) / mRAG (4) / comms (4) — a
  // breakdown summing to 78 under a headline of 85, the exact shape this gate exists for. The
  // realm llms.txt and the Smithery copy carried mDM 14 / mIRC 24 / mRAG 4 from alpha.33.
  {
    file: "examples/README.md",
    what: "examples README per-module list",
    // "- **mDM** (16): list_contacts, …"
    re: (label) => new RegExp(`\\*\\*${label}\\*\\*\\s*\\((\\d+)\\)`),
  },
  {
    file: "README.md",
    what: "README tools line",
    // "mDM 16 · mIRC 25 · mURL 7 · mAYL 16 · mTALK 6 · mRAG 8 · comms 5 · threat 2"
    re: (label) => new RegExp(`\\b${label} (\\d+) ·`),
  },
];

describe("per-module tool-count consistency", () => {
  it("every registered tool falls into a known module/capability prefix", () => {
    const known = new Set([...MODULE_LABELS.map((m) => m.prefix), "comms", "threat"]);
    const strays = Object.keys(liveByModule).filter((p) => !known.has(p));
    expect(
      strays,
      `unknown tool prefix(es) ${strays.join(", ")} — a new module shipped without a doc breakdown; ` +
        `add it to MODULE_LABELS and to every surface listed in MODULE_SURFACES`,
    ).toEqual([]);
  });

  it("the per-module numbers add up to TOOL_COUNT", () => {
    const sum = Object.values(liveByModule).reduce((a, b) => a + b, 0);
    expect(sum).toBe(TOOL_COUNT);
  });

  for (const s of MODULE_SURFACES) {
    for (const { label, prefix } of MODULE_LABELS) {
      it(`${s.what} (${s.file}) says ${label} = ${liveByModule[prefix]}`, () => {
        const txt = readFileSync(resolve(repoRoot, s.file), "utf8");
        const m = txt.match(s.re(label));
        expect(m, `no "${label} <n>" breakdown found in ${s.file} — did the surface change shape?`).toBeTruthy();
        expect(
          Number(m![1]),
          `${s.file} says ${label} has ${m![1]} tools but the registry has ${liveByModule[prefix]} — ` +
            `sync the surface or the registry`,
        ).toBe(liveByModule[prefix]);
      });
    }
  }
});
