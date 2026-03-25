import { clerkSetup } from "@clerk/testing/playwright";
import { type FullConfig } from "@playwright/test";
import { execSync } from "node:child_process";

const setup = async (config: FullConfig) => {
  await clerkSetup({ config });
  execSync("node --no-warnings e2e/scripts/seed.ts", { stdio: "inherit" });
};

export default setup;
