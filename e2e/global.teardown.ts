import { execSync } from "node:child_process";

const teardown = async () => {
  execSync("node --no-warnings e2e/scripts/teardown.ts", { stdio: "inherit" });
};

export default teardown;
