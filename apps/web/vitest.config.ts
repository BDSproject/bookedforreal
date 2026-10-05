import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Web unit tests (SEO metadata + JSON-LD builders). The App Router pages are
 * covered by Playwright E2E, so coverage is scoped to `src/lib` + `src/components`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.join(rootDir, "src"),
      "@bookedforreal": path.join(rootDir, "..", "..", "packages"),
    },
  },
  test: {
    environment: "node",
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.{ts,tsx}"],
      thresholds: {
        lines: 60,
        statements: 60,
        functions: 60,
        branches: 50,
      },
    },
  },
});
