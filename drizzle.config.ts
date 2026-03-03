import { envSchema } from "@/lib/env";
import { defineConfig } from "drizzle-kit";

const drizzleConfig = defineConfig({
  dbCredentials: {
    url: envSchema.DATABASE_URL,
  },
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./src/lib/db/schema/**/*.ts",
});

export default drizzleConfig;
