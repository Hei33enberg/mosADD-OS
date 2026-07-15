#!/usr/bin/env node
/**
 * REALM ledger updater — called by .github/workflows/realm-ledger.yml on merged PRs.
 *
 * Usage: node scripts/update-realm-ledger.mjs <login> <substantive:true|false>
 *
 * - Increments merged_prs (and substantive_prs when the PR carried the
 *   'substantive' label) for <login> in community/realm.json.
 * - Recomputes the level: L1 Squire (>=1 substantive) → L2 Knight (>=3
 *   substantive) — L3+ are appointed, never computed (REALM.md).
 * - Regenerates the table between <!-- REALM:BEGIN --> / <!-- REALM:END -->
 *   in HALL_OF_FAME.md from realm.json.
 * - Prints "LEVELUP:<login>:<newLevel>" when a level changed (the workflow
 *   turns that into a ceremony comment).
 *
 * Levels here mirror REALM.md; only merged-PR counts are automated. The
 * 'crown' role and L3+ are hand-maintained in realm.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const [login, substantiveArg] = process.argv.slice(2);
if (!login) {
  console.error("usage: update-realm-ledger.mjs <github-login> <substantive:true|false>");
  process.exit(2);
}
const substantive = substantiveArg === "true";

const LEDGER = join(ROOT, "community/realm.json");
const HOF = join(ROOT, "HALL_OF_FAME.md");

const ledger = JSON.parse(readFileSync(LEDGER, "utf8"));
ledger.members ??= {};
const m = (ledger.members[login] ??= {
  name: null,
  role: "contributor",
  level: null,
  merged_prs: 0,
  substantive_prs: 0,
  contributions: "",
  since: String(new Date().getUTCFullYear()),
});

const prevLevel = m.level;
m.merged_prs += 1;
if (substantive) m.substantive_prs += 1;

// Computed levels only for regular contributors; crown/appointed levels untouched.
if (m.role !== "crown" && (m.level === null || m.level === "L1" || m.level === "L2")) {
  if (m.substantive_prs >= 3) m.level = "L2";
  else if (m.substantive_prs >= 1) m.level = "L1";
}

ledger.updated = new Date().toISOString().slice(0, 10);
writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + "\n");

// ── regenerate the HALL_OF_FAME block ────────────────────────────────────────
const TITLES = {
  L1: "L1 · Squire (first-time contributor)",
  L2: "L2 · Knight (recognized contributor)",
  L3: "L3 · Baron/Baroness (area maintainer)",
  L4: "L4 · Herald (ambassador)",
  L5: "L5 · Peer of the Realm (certified partner)",
};
const rows = Object.entries(ledger.members)
  .sort(([, a], [, b]) => {
    if (a.role === "crown") return -1;
    if (b.role === "crown") return 1;
    return (b.substantive_prs ?? 0) - (a.substantive_prs ?? 0);
  })
  .map(([gh, v]) => {
    const name = v.name ?? `@${gh}`;
    const level = v.role === "crown" ? "—" : (v.level ?? "L0");
    const role = v.role === "crown" ? "The Crown (founder, BDFL)" : (TITLES[v.level] ?? "Citizen");
    const contrib =
      v.contributions ||
      `${v.merged_prs} merged PR${v.merged_prs === 1 ? "" : "s"}${v.substantive_prs ? ` (${v.substantive_prs} substantive)` : ""}`;
    return `| ${name} | [@${gh}](https://github.com/${gh}) | ${level} | ${role} | ${contrib} | ${v.since ?? ""} |`;
  });

const table = [
  "| Name | GitHub | Level | Realm role | Contributions | Since |",
  "|---|---|---|---|---|---|",
  ...rows,
].join("\n");

const hof = readFileSync(HOF, "utf8");
const updated = hof.replace(
  /(<!-- REALM:BEGIN[^>]*-->)[\s\S]*?(<!-- REALM:END -->)/,
  `$1\n${table}\n$2`
);
if (updated === hof && !hof.includes("REALM:BEGIN")) {
  console.error("HALL_OF_FAME.md: REALM:BEGIN/END markers not found");
  process.exit(1);
}
writeFileSync(HOF, updated);

if (m.level !== prevLevel && m.role !== "crown") {
  console.log(`LEVELUP:${login}:${m.level}`);
}
console.log(`✓ ledger updated — ${login}: ${m.merged_prs} merged (${m.substantive_prs} substantive), level ${m.level ?? "L0"}`);
