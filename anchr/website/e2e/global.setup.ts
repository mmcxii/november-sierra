import { type FullConfig } from "@playwright/test";
import { execSync } from "node:child_process";

// Global Playwright setup. Pre-cutover this called clerkSetup() to prime the
// Clerk testing token; post-ANC-152 we just seed the BA-flavored test users
// directly via Drizzle. The seed script handles its own auth (DATABASE_URL +
// E2E_USER_PASSWORD).
const setup = async (_config: FullConfig) => {
  execSync("node --no-warnings e2e/scripts/seed.ts", { stdio: "inherit" });
};

export default setup;
