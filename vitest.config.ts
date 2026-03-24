import path from "node:path";
import { defineConfig } from "vitest/config";

const vitestConfig = defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}", "eslint/**/*.test.ts", "scripts/**/*.test.ts"],
    testTimeout: 15000,
  },
});

export default vitestConfig;
