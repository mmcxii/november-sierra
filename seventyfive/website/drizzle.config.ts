import { defineConfig } from "drizzle-kit";

const drizzleConfig = defineConfig({
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./src/lib/db/schema/**/*.ts",
});

export default drizzleConfig;
