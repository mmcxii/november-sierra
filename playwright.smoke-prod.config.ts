import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke test config for post-deploy verification against live production.
 * No webServer — tests run against the deployed anchr.to.
 * No globalSetup/globalTeardown — no test users, no DB writes.
 * Read-only only — verifies the deployment landed and key endpoints respond.
 */
export default defineConfig({
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  outputDir: "test-results-smoke-prod",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: [["html", { open: "never" }]],
  retries: 2,
  testDir: "./e2e/smoke",
  testMatch: "prod.spec.ts",
  timeout: 60_000,
  use: {
    baseURL: process.env.SMOKE_BASE_URL ?? "https://anchr.to",
    trace: "on-first-retry",
  },
  workers: 1,
});
