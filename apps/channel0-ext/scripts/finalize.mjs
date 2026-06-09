// Post-build cleanup: drop any nested dist/src/ tree a bundler may leave behind.
// The extension's only surface is the in-page docked panel (content script);
// there is no sidepanel build anymore.
import { rmSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = resolve(__dirname, "..", "dist");
const srcTree = resolve(dist, "src");

if (existsSync(srcTree)) rmSync(srcTree, { recursive: true, force: true });

console.log("[finalize] ok — in-page panel only (no sidepanel)");
