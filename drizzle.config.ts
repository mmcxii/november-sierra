import { defineConfig } from "drizzle-kit";

const drizzleConfig = defineConfig({
  // DATABASE_URL is read directly from process.env so drizzle-kit commands that
  // don't need a connection (generate, check) work without loading the full env
  // schema. The URL is still validated by envSchema at runtime in src/lib/db/client.ts.
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./src/lib/db/schema/**/*.ts",
});

export default drizzleConfig;
