import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
// THREAT_EVENT_COUNT is derived in index.ts; the taxonomy itself lives in taxonomy.ts.
import { THREAT_EVENT_COUNT } from "../index.js";
import { CATEGORY_EVENT_COUNTS, CATEGORIES, THREAT_EVENTS } from "../taxonomy.js";

// ── Anti-drift gate ──────────────────────────────────────────────────────────
// Sibling of packages/mcp/src/__tests__/tool-count-consistency.test.ts, and it exists
// for the same reason: every stale number in this repo's history came from a human
// typing a total into a README, a badge, or a code comment and then changing the code.
//
// `THREAT_EVENT_COUNT` (= THREAT_EVENTS.length) is the ONE source of truth. Any surface
// that states the number in prose must equal it. If you add or remove a taxonomy entry,
// this test fails until every surface below is updated (or vice-versa).
//
// PREFER NOT ADDING A SURFACE HERE. The better fix for most prose is to not state a
// number at all — say "the full taxonomy" or point the reader at THREAT_EVENT_COUNT.
// A number that isn't written down can never go stale. This list is deliberately short:
// the badge (a wrong number in a green badge is the most confident-looking lie a repo
// can tell), the npm-visible package description, and the two READMEs people read.
//
// ⚠ CROSS-REPO: the mosADD app ships its own copy of this taxonomy at
// m0ssad-3 apps/web/src/lib/threatEvents.ts. The two are expected to stay at parity —
// see the parity note in ../taxonomy.ts. This test cannot reach across repos; the
// `taxonomy is internally consistent` case below at least guarantees THIS copy is sane.

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../../.."); // packages/threat-engine/src/__tests__ -> repo root

const SURFACES: { file: string; re: RegExp; what: string }[] = [
  {
    file: "README.md",
    re: /badge\/threat%20events-(\d+)/,
    what: "root README badge",
  },
  {
    file: "README.md",
    re: /canonical taxonomy of \*\*(\d+) threat events\*\*/,
    what: "root README threat-engine paragraph",
  },
  {
    file: "packages/threat-engine/package.json",
    re: /\((\d+) canonical events\)/,
    what: "npm-visible package description",
  },
  {
    file: "packages/threat-engine/README.md",
    re: /\*\*(\d+) canonical threat-event types\*\*/,
    what: "threat-engine README intro",
  },
  {
    file: "packages/mcp/README.md",
    re: /(\d+)-event threat taxonomy/,
    what: "MCP README Irondome row",
  },
];

describe("threat-event count consistency (anti-drift gate)", () => {
  it("THREAT_EVENT_COUNT is a positive integer matching THREAT_EVENTS.length", () => {
    expect(Number.isInteger(THREAT_EVENT_COUNT)).toBe(true);
    expect(THREAT_EVENT_COUNT).toBeGreaterThan(0);
    expect(THREAT_EVENT_COUNT).toBe(THREAT_EVENTS.length);
  });

  it("has no duplicate event ids (a duplicate silently shadows the earlier def)", () => {
    const ids = THREAT_EVENTS.map((e) => e.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes, `duplicate event ids: ${[...new Set(dupes)].join(", ")}`).toEqual([]);
  });

  it("per-category counts sum to the total (no event in an unlisted category)", () => {
    const sum = CATEGORIES.reduce((n, c) => n + CATEGORY_EVENT_COUNTS[c], 0);
    expect(sum).toBe(THREAT_EVENT_COUNT);
  });

  it("every event declares at least one platform", () => {
    const orphans = THREAT_EVENTS.filter((e) => e.platforms.length === 0).map((e) => e.id);
    expect(orphans, `events with no platform: ${orphans.join(", ")}`).toEqual([]);
  });

  for (const s of SURFACES) {
    it(`${s.what} (${s.file}) states exactly THREAT_EVENT_COUNT (${THREAT_EVENT_COUNT})`, () => {
      const txt = readFileSync(resolve(repoRoot, s.file), "utf8");
      const m = txt.match(s.re);
      expect(
        m,
        `no threat-event count found in ${s.file} — did the surface change shape?`,
      ).toBeTruthy();
      expect(
        Number(m![1]),
        `${s.file} says ${m![1]} but THREAT_EVENT_COUNT is ${THREAT_EVENT_COUNT} — sync the surface or the taxonomy`,
      ).toBe(THREAT_EVENT_COUNT);
    });
  }

  it("no surface hardcodes the OLD pre-port count (166) as a taxonomy total", () => {
    // 166 was the published count while the taxonomy was a strict subset of the app's.
    // It survived in five places at once. Catch a partial revert.
    for (const s of SURFACES) {
      const txt = readFileSync(resolve(repoRoot, s.file), "utf8");
      const m = txt.match(s.re);
      expect(Number(m![1]), `${s.file} reverted to the stale 166`).not.toBe(166);
    }
  });
});
