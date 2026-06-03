// Post-build: move dist/src/sidepanel/index.html → dist/sidepanel.html, patch
// absolute asset paths → relative, drop the now-empty dist/src/ tree.
import { readFileSync, writeFileSync, rmSync, existsSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = resolve(__dirname, "..", "dist");
const nested = resolve(dist, "src", "sidepanel", "index.html");
const target = resolve(dist, "sidepanel.html");

if (!existsSync(nested)) {
  console.error("[finalize] sidepanel html not at expected path:", nested);
  process.exit(1);
}

let html = readFileSync(nested, "utf8");
html = html
  .replace(/(?<=src=")\/(?=[^\/])/g, "./")
  .replace(/(?<=href=")\/(?=[^\/])/g, "./");

writeFileSync(target, html);
rmSync(resolve(dist, "src"), { recursive: true, force: true });

console.log(`[finalize] sidepanel.html → ${statSync(target).size} bytes`);
