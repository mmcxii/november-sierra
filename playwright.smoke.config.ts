import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke test config for post-deploy verification against live stage.
 * No webServer — tests run against the deployed stage.anchr.to.
 */
export default defineConfig({
  testDir: "./e2e/smoke",
  globalSetup: "./e2e/global.setup.ts",
  globalTeardown: "./e2e/global.teardown.ts",
  fullyParallel: false,
  timeout: 60_000,
  retries: 2,
  workers: 1,
  reporter: [["html", { open: "never" }]],
  outputDir: "test-results-smoke",
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: process.env.SMOKE_BASE_URL ?? "https://stage.anchr.to",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
