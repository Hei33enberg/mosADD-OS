import { defineConfig } from "vite";
import { resolve } from "node:path";

// Sidepanel + background entries.
// Content script built separately (vite.config.content.ts) as single IIFE.
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2020",
    minify: false,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, "src/sidepanel/index.html"),
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
