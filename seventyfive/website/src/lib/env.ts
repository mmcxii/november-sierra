import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const serverSchema = {
  CRON_SECRET: z.string().min(1).optional(),
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SESSION_SECRET: z.string().min(32),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default("mailto:hello@seventyfive.team"),
};

const clientSchema = {
  NEXT_PUBLIC_APP_URL: z.string().url().default("https://seventyfive.team"),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
};

export const CLIENT_ENV_KEYS = Object.keys(clientSchema);
export const SERVER_ENV_KEYS = Object.keys(serverSchema);

export const envSchema = createEnv({
  client: clientSchema,
  emptyStringAsUndefined: true,
  runtimeEnv: {
    CRON_SECRET: process.env.CRON_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    NODE_ENV: process.env.NODE_ENV,
    SESSION_SECRET: process.env.SESSION_SECRET,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
  },
  server: serverSchema,
});
