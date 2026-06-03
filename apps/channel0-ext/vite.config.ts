import { defineConfig } from "vite";
import { resolve } from "node:path";

// Popup + background entries. The popup is a real HTML page so ES modules
// resolve normally; the MV3 service worker is "type: module" so static
// imports are fine too. Code splitting between them is OK.
// The content script is built separately by vite.config.content.ts as a
// single self-contained IIFE — content scripts run inside host pages and
// can't fetch chunks across chrome-extension://.
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2020",
    minify: false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        background: resolve(__dirname, "src/background/index.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (asset) => {
          if (asset.name === "index.html") return "popup.html";
          return "assets/[name][extname]";
        },
      },
    },
  },
  publicDir: "public",
});
