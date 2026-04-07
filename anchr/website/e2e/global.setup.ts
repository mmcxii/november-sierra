import { clerkSetup } from "@clerk/testing/playwright";
import { type FullConfig } from "@playwright/test";
import { execSync } from "node:child_process";

const setup = async (config: FullConfig) => {
  // @clerk/testing types lag behind the runtime API — config is accepted but not yet typed
  await clerkSetup({ config } as Parameters<typeof clerkSetup>[0]);
  execSync("node --no-warnings e2e/scripts/seed.ts", { stdio: "inherit" });
};

export default setup;
