import { defineConfig } from "vitest/config";

const vitestConfig = defineConfig({
  test: {
    include: ["rules/**/*.test.ts"],
    testTimeout: 15000,
  },
});

export default vitestConfig;
