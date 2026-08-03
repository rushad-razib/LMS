import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
    fileParallelism: false,
    pool: "forks",
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      // keep relative imports as-is; vitest handles TS via esbuild
    },
  },
  root,
});
