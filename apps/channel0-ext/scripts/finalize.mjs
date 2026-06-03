// Post-build: move the popup HTML from Vite's nested output path
// (dist/src/popup/index.html) up to dist/popup.html so the manifest can find
// it, and patch its asset hrefs to relative form for chrome-extension://.
// Also drops the now-empty dist/src tree.
import { readFileSync, writeFileSync, rmSync, existsSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = resolve(__dirname, "..", "dist");
const nested = resolve(dist, "src", "popup", "index.html");
const target = resolve(dist, "popup.html");

if (!existsSync(nested)) {
  console.error("[finalize] popup html not at expected path:", nested);
  process.exit(1);
}

// Rewrite absolute `src="/...` / `href="/..."` → relative — chrome-extension://
// is fine either way, but relative makes the popup also work when opened
// directly for visual smoke testing.
let html = readFileSync(nested, "utf8");
html = html
  .replace(/(?<=src=")\/(?=[^\/])/g, "./")
  .replace(/(?<=href=")\/(?=[^\/])/g, "./");

writeFileSync(target, html);
rmSync(resolve(dist, "src"), { recursive: true, force: true });

console.log(`[finalize] popup.html → ${statSync(target).size} bytes`);
