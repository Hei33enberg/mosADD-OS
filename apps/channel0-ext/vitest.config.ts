import { defineConfig } from "vitest/config";

// Pure-logic unit tests run in the node environment (no DOM). The DOM-dependent
// extractors (extractBrandAccent, rankedAccent, etc.) are exercised manually via
// the loaded extension; here we cover the deterministic, dependency-free core.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
