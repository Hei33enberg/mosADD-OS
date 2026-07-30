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
// Banned phrases in prose. Each entry: [regex, why]. Case-insensitive.
// Allowlist: a line containing "honesty-lint:allow" is skipped (for docs that
// discuss the banned phrase itself, e.g. e2ee-posture.md quoting what NOT to say).
const BANNED = [
  [/unbannable/i, `"unbannable" — we don't claim that (HYDRA lesson)`],
  [/everything is (end-to-end )?encrypted/i, `blanket encryption claim — only mDM is E2EE`],
  [/all messages are (end-to-end )?encrypted/i, `blanket encryption claim — only mDM is E2EE`],
  [/zero[- ]knowledge everywhere/i, `blanket zero-knowledge claim — only the encrypted paths are`],
  [/sealed sender/i, `"sealed sender" — mosadd does not hide who-messaged-whom`],
  [/military[- ]grade/i, `"military-grade" — meaningless marketing crypto claim`],
  [/nsa[- ]proof/i, `"NSA-proof" — false absolute`],
  [/zero[- ]trace/i, `"zero-trace" — false absolute (the motto "Trust no trace" is fine; "zero-trace" is not)`],
  [/cannot be monitored/i, `"cannot be monitored" — false absolute`],
  [/\bno logs\b/i, `"no logs" — we don't claim that`],
  [/we can never be compelled/i, `false legal absolute`],

  // ── mLIDAR / threat-detection over-claims (LINEAR-4838) ────────────────────────────────────
  // These come from the 2026-07-14 mLIDAR code+DB audit, which found every one of them live on a
  // public surface. Until now the honesty lint had NO rule for any of them: it policed encryption
  // language and said nothing about detection language, which is the half with the bigger gap
  // between what the taxonomy describes (193 event types) and what a collector emits (20).
  // The counter-claims, one at a time:
  //   · Nothing detects live Pegasus from a public list — the Amnesty sets are seized 2021 infra.
  //   · Zero-click, IMSI-catcher/Stingray, rogue-certificate and jailbreak detection are taxonomy
  //     entries with no emitter. They are not features.
  //   · mLIDAR uploads detections to `device_events`, so it is not "100% on-device".
  //   · It is a 60-second poll while the desktop app is open — not 24/7, not always-on.
  [/(only|first) (messenger|app|product)[^.]{0,40}detects?/i, `superlative detection claim — we are not the only or first anything here`],
  [/detects? (live )?pegasus/i, `"detects Pegasus" — public indicator lists cannot detect live Pegasus infrastructure`],
  [/zero[- ]click[^.]{0,30}(detect|scan|flag|protect)/i, `zero-click detection — in the taxonomy, no detector emits it`],
  [/(imsi[- ]catcher|stingray)[^.]{0,30}(detect|scan|flag)/i, `IMSI-catcher/Stingray detection — in the taxonomy, no detector emits it`],
  [/rogue[- ]certificate[s]?[^.]{0,30}(detect|scan|flag)/i, `rogue-certificate detection — not implemented (no certificate inspection)`],
  [/100% on[- ]device/i, `"100% on-device" — mLIDAR uploads detections to your account; true of mDM content only`],
  [/zero cloud custody/i, `"zero cloud custody" — false for mLIDAR telemetry`],
  [/24\/7[^.]{0,25}(monitor|scan|watch|protect)/i, `"24/7 monitoring" — mLIDAR is a 60-second poll, only while the desktop app is open`],
  [/iron ?dome for your phone/i, `"iron dome for your phone" — there is no phone spyware monitor; desktop + Android posture only`],
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
    for (const [re, why] of BANNED) {
      const m = re.exec(line);
      if (!m) continue;
      // Skip explicit negations like "never claim X", "we don't say X", "❌ X".
      //
      // TIGHTENED 2026-07-30 (LINEAR-4838): this used to test the WHOLE line for `not\b`, which is
      // one of the most common words in English prose — so a sentence like "mosADD is not a toy and
      // everything is encrypted" passed the gate while making the exact blanket claim the rule
      // exists to stop. The negation now has to appear in the ~40 characters immediately BEFORE the
      // banned phrase, which is where a real negation of it would actually sit.
      const before = line.slice(Math.max(0, m.index - 40), m.index);
      if (/\b(never|don'?t|do not|won'?t|isn'?t|is not|are not|no longer|not)\b[^.]*$|❌/i.test(before)) continue;
      fail(`${relPosix}:${i + 1}: banned phrase — ${why}`);
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
