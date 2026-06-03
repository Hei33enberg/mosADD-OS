#!/usr/bin/env node
// =============================================================================
// sync-embed-bundle.mjs (LINEAR-2739)
//
// Pre-build step for `apps/dev` that re-builds `apps/embed` and copies the
// IIFE bundle into `apps/dev/public/` so `mosadd.dev/v1.js` (and the soon-to-be-
// aliased `embed.mosadd.com/v1.js`) serve the latest widget.
//
// Why a script vs. a one-line `cp`: on Vercel the build runs from `apps/dev`
// only — `apps/embed` may not have `node_modules` yet. We:
//   1. Install apps/embed deps if missing.
//   2. Build the IIFE bundle.
//   3. Copy v1.js + v1.js.map to apps/dev/public/.
//
// Tolerant to failure (`|| true` in the wrapping `prebuild` script in
// apps/dev/package.json) — if anything errors we fall back to whatever
// v1.js is currently committed in `apps/dev/public/`. CI keeps building.
// =============================================================================
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const embed = join(repoRoot, "apps", "embed");
const dev = join(repoRoot, "apps", "dev");

const log = (s) => console.log(`[sync-embed-bundle] ${s}`);

if (!existsSync(embed)) {
  log(`apps/embed not found at ${embed} — nothing to sync.`);
  process.exit(0);
}

try {
  if (!existsSync(join(embed, "node_modules"))) {
    log("apps/embed/node_modules missing — installing deps");
    execSync("npm install --no-audit --no-fund", { cwd: embed, stdio: "inherit" });
  }
  log("Building apps/embed");
  execSync("npm run build", { cwd: embed, stdio: "inherit" });

  const distFile = join(embed, "dist", "v1.js");
  const mapFile = join(embed, "dist", "v1.js.map");
  if (!existsSync(distFile)) {
    log("dist/v1.js missing after build — bailing");
    process.exit(0);
  }
  const publicDir = join(dev, "public");
  if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

  copyFileSync(distFile, join(publicDir, "v1.js"));
  if (existsSync(mapFile)) copyFileSync(mapFile, join(publicDir, "v1.js.map"));
  log(`Copied v1.js → ${join(publicDir, "v1.js")}`);
} catch (err) {
  log(`sync failed: ${err?.message ?? err}`);
  // Don't crash the apps/dev build — the previously committed v1.js stays in place.
  process.exit(0);
}
