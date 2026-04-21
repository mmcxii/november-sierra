import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const clientSchemaShape = {
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string(),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string(),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string(),
  NEXT_PUBLIC_SHORT_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().refine((v) => v.startsWith("pk_test_") || v.startsWith("pk_live_"), {
    message: "Must be a Stripe publishable key (pk_test_… or pk_live_…)",
  }),
} as const;

const serverSchemaShape = {
  ADMIN_USER_ID: z.string().optional(),
  CLERK_SECRET_KEY: z.string(),
  CLERK_WEBHOOK_SECRET: z.string(),
  CRON_SECRET: z.string(),
  DATABASE_URL: z.url(),
  RESEND_API_KEY: z.string(),
  // Stripe ID prefixes are stable across the API. We validate at boot
  // because misconfiguring a price var to a product id (`prod_…`)
  // instead of a price id (`price_…`) is a silent footgun: checkout
  // creation fails at runtime with "No such price" and the user sees a
  // generic toast. Catching it here turns the misconfig into a
  // build/deploy failure instead of a broken purchase flow on prod.
  // https://docs.stripe.com/api/prices
  STRIPE_PRO_PRICE_ID_ANNUAL: z
    .string()
    .startsWith("price_", "Must be a Stripe price id (price_…), not a product id (prod_…)"),
  STRIPE_PRO_PRICE_ID_MONTHLY: z
    .string()
    .startsWith("price_", "Must be a Stripe price id (price_…), not a product id (prod_…)"),
  STRIPE_SECRET_KEY: z
    .string()
    .refine((v) => v.startsWith("sk_test_") || v.startsWith("sk_live_") || v.startsWith("rk_"), {
      message: "Must be a Stripe secret key (sk_test_…, sk_live_…) or restricted key (rk_…)",
    }),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_", "Must be a Stripe webhook signing secret (whsec_…)"),
  UPLOADTHING_TOKEN: z.string(),
  UPSTASH_REDIS_REST_TOKEN: z.string(),
  UPSTASH_REDIS_REST_URL: z.string(),
  VERCEL_API_TOKEN: z.string(),
  VERCEL_PROJECT_ID: z.string(),
  VERCEL_TEAM_ID: z.string().optional(),
  WEBHOOK_SIGNING_ENCRYPTION_KEY: z.string().length(64),
} as const;

export const CLIENT_ENV_KEYS = Object.keys(clientSchemaShape) as (keyof typeof clientSchemaShape)[];
export const SERVER_ENV_KEYS = Object.keys(serverSchemaShape) as (keyof typeof serverSchemaShape)[];

export const envSchema = createEnv({
  client: clientSchemaShape,
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_SHORT_DOMAIN: process.env.NEXT_PUBLIC_SHORT_DOMAIN,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,

    ADMIN_USER_ID: process.env.ADMIN_USER_ID,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    STRIPE_PRO_PRICE_ID_ANNUAL: process.env.STRIPE_PRO_PRICE_ID_ANNUAL,
    STRIPE_PRO_PRICE_ID_MONTHLY: process.env.STRIPE_PRO_PRICE_ID_MONTHLY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    VERCEL_API_TOKEN: process.env.VERCEL_API_TOKEN,
    VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID,
    VERCEL_TEAM_ID: process.env.VERCEL_TEAM_ID,
    WEBHOOK_SIGNING_ENCRYPTION_KEY: process.env.WEBHOOK_SIGNING_ENCRYPTION_KEY,
  },
  server: serverSchemaShape,
});
