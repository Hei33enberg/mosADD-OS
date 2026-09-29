#!/usr/bin/env node
/**
 * skill-lint + honesty-lint — the drift gate.
 *
 * Checks (all hard failures):
 *  1. Every skills/<dir>/SKILL.md follows the agentskills.io spec: YAML frontmatter with
 *     `name` + `description`, `name` equal to the directory name, lowercase letters, digits
 *     and single hyphens, at most 64 characters; `description` at most 1024 characters.
 *  2. skills/ dirs ↔ the root `.claude-plugin/marketplace.json` plugin entry's `skills[]`
 *     are in sync both ways (except `mosadd-coordinate`, which is intentionally distributed with
 *     the agent runtime), and `skills/.claude-plugin/plugin.json` exists.
 *  3. Version check: every 3.0.0-alpha.N in README == skills/.claude-plugin/plugin.json ==
 *     packages/mcp/package.json (packages/mcp/server.json and distribution/server.json too).
 *  4. Honesty-lint: banned claim phrases must not appear in prose files, and docs may
 *     not reference community surfaces that don't exist (community/surfaces.json).
 *
 * Run: node scripts/check-skill-lint.mjs
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { violations } from "./honesty-rules.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const errors = [];
const fail = (msg) => errors.push(msg);
const read = (p) => readFileSync(join(ROOT, p), "utf8");

// ── 1. skill frontmatter ─────────────────────────────────────────────────────
const SKILLS_DIR = join(ROOT, "skills");
const skillDirs = readdirSync(SKILLS_DIR).filter(
  (d) => statSync(join(SKILLS_DIR, d)).isDirectory() && !d.startsWith(".")
);
const skillNames = new Map(); // dir -> frontmatter name
for (const dir of skillDirs) {
  const p = join(SKILLS_DIR, dir, "SKILL.md");
  if (!existsSync(p)) {
    fail(`skills/${dir}/ has no SKILL.md`);
    continue;
  }
  const src = readFileSync(p, "utf8");
  const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) {
    fail(`skills/${dir}/SKILL.md: missing YAML frontmatter`);
    continue;
  }
  const name = fm[1].match(/^name:\s*(\S+)\s*$/m)?.[1];
  const desc = fm[1].match(/^description:\s*(.+)$/m)?.[1];
  if (!name) fail(`skills/${dir}/SKILL.md: frontmatter missing 'name'`);
  if (!desc || desc.trim().length < 20)
    fail(`skills/${dir}/SKILL.md: frontmatter missing or too-short 'description'`);
  if (desc && desc.trim().length > 1024)
    fail(`skills/${dir}/SKILL.md: description is ${desc.trim().length} chars (agentskills.io max 1024)`);
  // agentskills.io: name == directory, [a-z0-9-], no leading/trailing/double hyphen, <= 64 chars
  if (name && name !== dir) fail(`skills/${dir}/SKILL.md: name '${name}' != directory '${dir}' (agentskills.io)`);
  if (name && (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || name.length > 64))
    fail(`skills/${dir}/SKILL.md: name '${name}' breaks the agentskills.io name rules`);
  if (name) skillNames.set(dir, name);
}

// ── 2. marketplace sync ──────────────────────────────────────────────────────
// Layout (verified working against Claude Code 2.x, 2026-08-01):
//   .claude-plugin/marketplace.json  — the marketplace; its `plugins[]` entry
//     'mosadd' has source "./skills" and an explicit `skills[]` of "./<dir>" paths.
//   skills/.claude-plugin/plugin.json — the plugin manifest (name, version).
//   skills/.mcp.json                  — registers the @mosadd/mcp server.
let marketplace;
let pluginEntry;
try {
  marketplace = JSON.parse(read(".claude-plugin/marketplace.json"));
} catch (e) {
  fail(`.claude-plugin/marketplace.json: invalid JSON — ${e.message}`);
}
if (marketplace) {
  pluginEntry = (marketplace.plugins ?? []).find((p) => p.name === "mosadd");
  if (!pluginEntry) fail(`.claude-plugin/marketplace.json: no plugins[] entry named 'mosadd'`);
}
if (pluginEntry) {
  if (pluginEntry.source !== "./skills")
    fail(`.claude-plugin/marketplace.json: plugin 'mosadd' source '${pluginEntry.source}' != './skills'`);
  const listedDirs = new Set(
    (pluginEntry.skills ?? []).map((s) => String(s).replace(/^\.\//, ""))
  );
  for (const [dir] of skillNames) {
    if (dir === "mosadd-coordinate") continue; // distributed with the agent runtime, by design
    if (!listedDirs.has(dir))
      fail(`.claude-plugin/marketplace.json: skill dir '${dir}' (skills/${dir}/) not listed in plugins[].skills`);
  }
  for (const s of pluginEntry.skills ?? []) {
    const rel = `skills/${String(s).replace(/^\.\//, "")}`;
    if (!existsSync(join(ROOT, rel, "SKILL.md")))
      fail(`.claude-plugin/marketplace.json: plugins[].skills entry '${s}' has no ${rel}/SKILL.md`);
  }
  if (listedDirs.has("mosadd-coordinate"))
    fail(`.claude-plugin/marketplace.json: 'mosadd-coordinate' must NOT be in the bundle (agent-runtime distribution)`);
}
let pluginManifest;
try {
  pluginManifest = JSON.parse(read("skills/.claude-plugin/plugin.json"));
  if (pluginManifest.name !== "mosadd")
    fail(`skills/.claude-plugin/plugin.json: name '${pluginManifest.name}' != 'mosadd'`);
} catch (e) {
  fail(`skills/.claude-plugin/plugin.json: ${e.message}`);
}
try {
  const mcpJson = JSON.parse(read("skills/.mcp.json"));
  if (!mcpJson.mcpServers?.mosadd) fail(`skills/.mcp.json: no mcpServers.mosadd entry`);
} catch (e) {
  fail(`skills/.mcp.json: ${e.message}`);
}

// ── 3. version triple-check ──────────────────────────────────────────────────
const mcpVersion = JSON.parse(read("packages/mcp/package.json")).version;
const readme = read("README.md");
const readmeVersions = [...readme.matchAll(/3\.0\.0-{1,2}alpha[.-]?\d+/g)].map((m) =>
  m[0].replace(/--/, "-").replace(/alpha[.-]?/, "alpha.")
);
for (const v of readmeVersions) {
  if (v !== mcpVersion)
    fail(`README.md mentions version '${v}' but packages/mcp/package.json is '${mcpVersion}'`);
}
if (pluginManifest && pluginManifest.version !== mcpVersion)
  fail(`skills/.claude-plugin/plugin.json version '${pluginManifest.version}' != packages/mcp '${mcpVersion}'`);
try {
  const server = JSON.parse(read("packages/mcp/server.json"));
  if (server.version !== mcpVersion)
    fail(`packages/mcp/server.json version '${server.version}' != package.json '${mcpVersion}'`);
  for (const pkg of server.packages ?? [])
    if (pkg.version !== mcpVersion)
      fail(`packages/mcp/server.json packages[].version '${pkg.version}' != '${mcpVersion}'`);
} catch (e) {
  fail(`packages/mcp/server.json: ${e.message}`);
}
// distribution/server.json (the MCP registry entry for the hub) carries the version the hub reports.
try {
  const dist = JSON.parse(read("distribution/server.json"));
  if (dist.version !== mcpVersion)
    fail(`distribution/server.json version '${dist.version}' != packages/mcp '${mcpVersion}'`);
} catch (e) {
  fail(`distribution/server.json: ${e.message}`);
}
// The private workspace root must not carry a sixth version string (it said 3.0.0-alpha.4 until 2026-09-29).
try {
  const root = JSON.parse(read("package.json"));
  if (root.version !== undefined && root.version !== mcpVersion)
    fail(`package.json (workspace root) version '${root.version}' != packages/mcp '${mcpVersion}' — drop it or keep it equal`);
} catch (e) {
  fail(`package.json: ${e.message}`);
}
// distribution/hub-tools.json is the measured tools/list of the hub; its server version is the one README cites.
try {
  const hub = JSON.parse(read("distribution/hub-tools.json"));
  if (hub.server_version !== mcpVersion)
    fail(`distribution/hub-tools.json server_version '${hub.server_version}' != packages/mcp '${mcpVersion}' — re-measure: node scripts/check-hub-tools.mjs --write`);
} catch (e) {
  fail(`distribution/hub-tools.json: ${e.message}`);
}
// server.ts hardcodes the MCP serverInfo version — keep it in lockstep too.
try {
  const serverTs = read("packages/mcp/src/server.ts");
  for (const m of serverTs.matchAll(/3\.0\.0-alpha\.\d+/g))
    if (m[0] !== mcpVersion)
      fail(`packages/mcp/src/server.ts serverInfo version '${m[0]}' != package.json '${mcpVersion}'`);
} catch (e) {
  fail(`packages/mcp/src/server.ts: ${e.message}`);
}

// ── 4. honesty-lint ──────────────────────────────────────────────────────────
// Banned phrases in prose live in scripts/honesty-rules.mjs (one object per rule, each with a `sample`
// sentence it must flag; packages/m0s/test proves every rule fires on its sample).
// Allowlist: a line containing "honesty-lint:allow" is skipped (for docs that
// discuss the banned phrase itself, e.g. e2ee-posture.md quoting what NOT to say).
// Files that legitimately discuss banned phrases (they define the policy).
// Kept minimal on purpose: the two files that must literally spell out the
// banned phrases to define the policy. MANIFESTO.md is deliberately NOT exempt —
// it is the highest-visibility doc and must pass the same honesty bar.
const HONESTY_EXEMPT = new Set([
  "docs/security/e2ee-posture.md", // the policy source — lists ❌ phrases verbatim
  "scripts/check-skill-lint.mjs", // this file names the phrases it bans
  "docs/architecture/human-os.md", // quotes the banned phrases as examples of what we DON'T say
  "docs/rfcs/0002-unified-crypto-identity.md", // prior-art: describes Signal's sealed sender (a fact about Signal)
]);

let surfaces = null;
try {
  surfaces = JSON.parse(read("community/surfaces.json"));
} catch (e) {
  fail(`community/surfaces.json: ${e.message}`);
}

/*
 * WHICH TREES THE HONESTY LINT WALKS.
 *
 * WIDENED 2026-07-30 (LINEAR-4838). This walk used to skip `apps` outright and collect only `.md`
 * files. Both exclusions pointed at the same blind spot, and it was the worst possible one: the
 * entire PUBLIC MARKETING SITE lives in `apps/dev/app/**` as `.tsx`, plus `apps/dev/public/llms.txt`
 * — the file we hand to language models. So the one tree with the widest audience was the one tree
 * the honesty lint could not see, and it is exactly where the audit found "the only messenger that
 * detects Pegasus"-class copy, a stale 69-tool count on the hero, and a Discord link that
 * `community/surfaces.json` explicitly bans.
 *
 * A linter that reads the documentation and not the marketing has it precisely backwards: prose in
 * `docs/` is read by contributors who can spot an over-claim, and the landing page is read by people
 * who cannot. So `apps` is now walked, and the collected extensions cover the files public copy
 * actually lives in.
 *
 * `packages` is walked for READMEs (they are published to npm and rendered on the package page).
 * `node_modules`, build output and `examples` stay excluded.
 */
const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", ".next", ".next-build", ".claude", ".claude-plugin",
  "coverage", ".turbo", ".vercel", "android", "ios",
]);
/** Trees whose contents are, or become, public copy. */
const SKIP_TOP = new Set(["examples", "supabase", "skins", "scripts"]);
/** Extensions that carry public prose. `.tsx` because the marketing site is a React app. */
const PROSE_EXT = /\.(md|mdx|txt|tsx|jsx)$/i;

const proseFiles = [];
(function walk(dir) {
  for (const entry of readdirSync(join(ROOT, dir))) {
    if (SKIP_DIRS.has(entry)) continue;
    const rel = dir ? `${dir}/${entry}` : entry;
    const full = join(ROOT, rel);
    if (statSync(full).isDirectory()) {
      if (!dir && SKIP_TOP.has(rel)) continue;
      walk(rel);
    } else if (PROSE_EXT.test(entry)) {
      proseFiles.push(rel);
    }
  }
})("");

for (const rel of proseFiles) {
  const relPosix = rel.replaceAll("\\", "/");
  if (HONESTY_EXEMPT.has(relPosix)) continue;
  const lines = read(relPosix).split(/\r?\n/);
  lines.forEach((line, i) => {
    if (line.includes("honesty-lint:allow")) return;
    // A pinned install must pin THE current version (a pin left at an old alpha is the same drift, one bump later).
    // Changelogs record old versions on purpose.
    if (!/(^|\/)CHANGELOG\.md$/.test(relPosix)) {
      for (const m of line.matchAll(/@mosadd\/mcp@(\d+\.\d+\.\d+-alpha\.\d+)/g))
        if (m[1] !== mcpVersion)
          fail(`${relPosix}:${i + 1}: pins @mosadd/mcp@${m[1]} but packages/mcp/package.json is '${mcpVersion}'`);
    }
    for (const { rule } of violations(line, relPosix)) {
      fail(`${relPosix}:${i + 1}: banned phrase — ${rule.why}`);
    }
    if (surfaces) {
      for (const ghost of surfaces.banned_references ?? []) {
        if (line.includes(ghost)) {
          fail(`${relPosix}:${i + 1}: references a community surface that doesn't exist ('${ghost}') — see community/surfaces.json`);
        }
      }
    }
  });
}

// ── report ───────────────────────────────────────────────────────────────────
if (errors.length) {
  console.error(`✗ skill-lint failed with ${errors.length} error(s):\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✓ skill-lint clean — ${skillNames.size} skills, marketplace in sync, version ${mcpVersion} consistent, honesty-lint passed (${proseFiles.length} prose files).`
);
