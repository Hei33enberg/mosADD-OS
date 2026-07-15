#!/usr/bin/env node
/**
 * skill-lint + honesty-lint — the drift gate.
 *
 * Checks (all hard failures):
 *  1. Every skills/<dir>/SKILL.md has YAML frontmatter with `name` + `description`,
 *     and `name` matches `mosadd-<dir>`.
 *  2. skills/ dirs ↔ marketplace.json `skills[]` are in sync both ways
 *     (except `coordinate`, which is intentionally distributed with the agent runtime).
 *  3. Version triple-check: README badge/heading == marketplace.json == packages/mcp/package.json
 *     (packages/mcp/server.json checked too).
 *  4. Honesty-lint: banned claim phrases must not appear in prose files, and docs may
 *     not reference community surfaces that don't exist (community/surfaces.json).
 *
 * Run: node scripts/check-skill-lint.mjs
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";

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
  const expected = dir === "coordinate" ? "mosadd-coordinate" : `mosadd-${dir}`;
  if (name && name !== expected)
    fail(`skills/${dir}/SKILL.md: name '${name}' != expected '${expected}'`);
  if (name) skillNames.set(dir, name);
}

// ── 2. marketplace sync ──────────────────────────────────────────────────────
let marketplace;
try {
  marketplace = JSON.parse(read("skills/.claude-plugin/marketplace.json"));
} catch (e) {
  fail(`skills/.claude-plugin/marketplace.json: invalid JSON — ${e.message}`);
}
if (marketplace) {
  const listed = new Set((marketplace.skills ?? []).map((s) => s.name));
  for (const [dir, name] of skillNames) {
    if (dir === "coordinate") continue; // distributed with the agent runtime, by design
    if (!listed.has(name)) fail(`marketplace.json: skill '${name}' (skills/${dir}/) not listed`);
  }
  for (const s of marketplace.skills ?? []) {
    const rel = s.path?.replace(/^\.\.\//, "skills/");
    if (!rel || !existsSync(join(ROOT, rel)))
      fail(`marketplace.json: entry '${s.name}' points at missing file '${s.path}'`);
  }
  if (listed.has("mosadd-coordinate"))
    fail(`marketplace.json: 'mosadd-coordinate' must NOT be in the bundle (agent-runtime distribution)`);
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
if (marketplace && marketplace.version !== mcpVersion)
  fail(`marketplace.json version '${marketplace.version}' != packages/mcp '${mcpVersion}'`);
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

// ── 4. honesty-lint ──────────────────────────────────────────────────────────
// Banned phrases in prose. Each entry: [regex, why]. Case-insensitive.
// Allowlist: a line containing "honesty-lint:allow" is skipped (for docs that
// discuss the banned phrase itself, e.g. e2ee-posture.md quoting what NOT to say).
const BANNED = [
  [/unbannable/i, `"unbannable" — we don't claim that (HYDRA lesson)`],
  [/everything is (end-to-end )?encrypted/i, `blanket encryption claim — only mDM is E2EE`],
  [/all messages are (end-to-end )?encrypted/i, `blanket encryption claim — only mDM is E2EE`],
  [/sealed sender/i, `"sealed sender" — mosadd does not hide who-messaged-whom`],
  [/military[- ]grade/i, `"military-grade" — meaningless marketing crypto claim`],
  [/\bno logs\b/i, `"no logs" — we don't claim that`],
  [/we can never be compelled/i, `false legal absolute`],
];
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

const PROSE_DIRS = ["", "docs", "skills", ".github"];
const proseFiles = [];
(function walk(dir) {
  for (const entry of readdirSync(join(ROOT, dir))) {
    if (["node_modules", ".git", "dist", ".next", ".next-build", ".claude", ".claude-plugin"].includes(entry)) continue;
    const rel = dir ? `${dir}/${entry}` : entry;
    const full = join(ROOT, rel);
    if (statSync(full).isDirectory()) {
      // only walk prose-bearing trees
      if (PROSE_DIRS.some((p) => rel === p || rel.startsWith(`${p}/`) || p === "")) {
        if (["packages", "apps", "examples", "supabase", "skins", "scripts", "community"].includes(rel)) continue;
        walk(rel);
      }
    } else if (/\.md$/i.test(entry)) {
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
    for (const [re, why] of BANNED) {
      // Skip explicit negations like "never claim", "don't claim", "not unbannable"
      if (re.test(line) && !/never|don'?t|do not|won'?t|isn'?t|not\b|❌/i.test(line)) {
        fail(`${relPosix}:${i + 1}: banned phrase — ${why}`);
      }
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
