import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  forbidOnly: process.env.CI != null,
  fullyParallel: true,
  globalSetup: "./e2e/global.setup.ts",
  globalTeardown: "./e2e/global.teardown.ts",
  outputDir: "test-results",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: [["html", { open: "never" }]],
  retries: process.env.CI != null ? 2 : 0,
  testDir: "./e2e",
  testIgnore: "**/smoke/**",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm next dev",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: "http://localhost:3000",
  },
  workers: 1,
});
