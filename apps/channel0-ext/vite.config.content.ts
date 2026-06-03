import { defineConfig } from "vite";
import { resolve } from "node:path";

// Content-script build: single self-contained IIFE, no chunks, no dynamic
// imports. Lives in dist/content.js so the manifest can load it on every page.
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false, // popup/background build already populated dist/
    target: "es2020",
    minify: false,
    lib: {
      entry: resolve(__dirname, "src/content/index.ts"),
      formats: ["iife"],
      name: "channel0Content",
      fileName: () => "content.js",
    },
    rollupOptions: {
      output: { extend: true },
    },
  },
  publicDir: false, // manifest already copied by the main build
});
