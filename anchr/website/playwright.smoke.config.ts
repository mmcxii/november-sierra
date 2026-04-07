import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke test config for post-deploy verification against live stage.
 * No webServer — tests run against the deployed stage.anchr.to.
 */
export default defineConfig({
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  globalSetup: "./e2e/global.setup.ts",
  globalTeardown: "./e2e/global.teardown.ts",
  outputDir: "test-results-smoke",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: [["html", { open: "never" }]],
  retries: 2,
  testDir: "./e2e/smoke",
  timeout: 60_000,
  use: {
    baseURL: process.env.SMOKE_BASE_URL ?? "https://stage.anchr.to",
    trace: "on-first-retry",
  },
  workers: 1,
});
