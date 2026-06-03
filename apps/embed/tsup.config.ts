import { defineConfig } from "tsup";

// Bundle the embed loader as a single IIFE that any browser can <script>-load.
// Output: dist/v1.js (the public CDN file at embed.mosadd.com/v1.js).
// CSS for skins is inlined into the bundle (we ship the default skin INSIDE the
// JS so a creator only needs the one <script> tag — no separate <link>).
export default defineConfig({
  entry: { v1: "src/index.ts" },
  format: ["iife"],
  globalName: "MosaddEmbed",
  target: "es2020",
  platform: "browser",
  minify: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  treeshake: true,
  dts: false,
  loader: { ".css": "text" },
  // Override tsup's IIFE convention of v1.global.js — we want v1.js so the CDN URL
  // stays clean: <script src="https://embed.mosadd.com/v1.js">.
  outExtension: () => ({ js: ".js" }),
});
