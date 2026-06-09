import { defineConfig } from "vite";
import { resolve } from "node:path";

// Background service worker entry. The chat UI is the in-page docked panel
// (content script, built separately in vite.config.content.ts as a single IIFE).
// No sidepanel — the in-page panel is the only surface.
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2020",
    minify: false,
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background/index.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
  publicDir: "public",
});
