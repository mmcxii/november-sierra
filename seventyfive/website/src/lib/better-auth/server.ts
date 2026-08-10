import { db } from "@/lib/db/client";
import {
  betterAuthAccountTable,
  betterAuthSessionTable,
  betterAuthUserTable,
  betterAuthVerificationTable,
} from "@/lib/db/schema/better-auth";
import { betterAuthSecret, envSchema } from "@/lib/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";

export const auth = betterAuth({
  basePath: "/api/auth",
  baseURL: envSchema.NEXT_PUBLIC_APP_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      account: betterAuthAccountTable,
      session: betterAuthSessionTable,
      user: betterAuthUserTable,
      verification: betterAuthVerificationTable,
    },
    usePlural: false,
  }),
  emailAndPassword: {
    autoSignIn: true,
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: false,
  },
  plugins: [
    username({
      maxUsernameLength: 30,
      minUsernameLength: 3,
      usernameValidator: (value) => {
        return /^[a-z0-9]+$/.test(value);
      },
    }),
    nextCookies(),
  ],
  secret: betterAuthSecret(),
  trustedOrigins: [envSchema.NEXT_PUBLIC_APP_URL],
  user: {
    additionalFields: {
      timeZone: {
        defaultValue: "UTC",
        required: true,
        type: "string",
      },
    },
  },
});

export type BetterAuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;
