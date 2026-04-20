import { db } from "@/lib/db/client";
import {
  betterAuthAccountTable,
  betterAuthSessionTable,
  betterAuthTwoFactorTable,
  betterAuthUserTable,
  betterAuthVerificationTable,
} from "@/lib/db/schema/better-auth";
import { envSchema } from "@/lib/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, twoFactor } from "better-auth/plugins";
import {
  sendChangeEmailConfirmation,
  sendOtpEmail,
  sendResetPasswordEmail,
  sendTwoFactorOtpEmail,
  sendVerificationEmail,
} from "./email";
import { hashPassword, verifyPassword } from "./password";

// Session cookie cache TTL — BA default 60s. Accepts <1 min revocation latency
// as the normal trade-off to keep the middleware hot path DB-free.
const COOKIE_CACHE_MAX_AGE_SECONDS = 60;

// Origins BA will accept for mutating POSTs (sign-in, sign-up, reset, etc.).
// In dev/CI the webServer runs on localhost; in stage/prod NEXT_PUBLIC_APP_URL
// is the canonical app origin. BETTER_AUTH_URL is optional and only set in
// environments where the BA endpoint is reachable on a different origin than
// the app itself (not our setup today, but future-proofing).
const TRUSTED_ORIGINS: string[] = [envSchema.NEXT_PUBLIC_APP_URL];
if (envSchema.BETTER_AUTH_URL != null && envSchema.BETTER_AUTH_URL !== envSchema.NEXT_PUBLIC_APP_URL) {
  TRUSTED_ORIGINS.push(envSchema.BETTER_AUTH_URL);
}

export const auth = betterAuth({
  // BA is mounted under /api/v1/auth/* so it inherits the /api/v1 rate-limiter
  // matcher in middleware. basePath is what BA writes into email links and
  // what the client calls against; keep server + client in lockstep with the
  // Next.js route location.
  basePath: "/api/v1/auth",
  // BA's baseURL feeds the URLs it embeds in email links. Fall back to the
  // canonical app URL when BETTER_AUTH_URL isn't set, which is the common case
  // (our BA routes live under the same origin as the app).
  baseURL: envSchema.BETTER_AUTH_URL ?? envSchema.NEXT_PUBLIC_APP_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      account: betterAuthAccountTable,
      session: betterAuthSessionTable,
      twoFactor: betterAuthTwoFactorTable,
      user: betterAuthUserTable,
      verification: betterAuthVerificationTable,
    },
    usePlural: false,
  }),
  emailAndPassword: {
    autoSignIn: true,
    enabled: true,
    minPasswordLength: 8,
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
    requireEmailVerification: true,
    // Invalidate all other sessions on password reset so a compromised device
    // can't keep a live session after the real user regains access.
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ url, user }) => {
      await sendResetPasswordEmail(user.email, url);
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    sendVerificationEmail: async ({ url, user }) => {
      await sendVerificationEmail(user.email, url);
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendOtpEmail(email, otp, type);
      },
    }),
    twoFactor({
      otpOptions: {
        async sendOTP({ otp, user }) {
          await sendTwoFactorOtpEmail(user.email, otp);
        },
      },
    }),
  ],
  rateLimit: {
    // Disabled deliberately. Our middleware (src/middleware.ts) routes every
    // /api/v1/auth/* request through rateLimitAuthRequest, which uses
    // Upstash-backed per-endpoint IP buckets and survives across Vercel
    // lambda instances. BA's built-in limiter is in-process and counts the
    // same request twice, causing false 429s under normal retry pressure
    // (observed in CI E2E with a 3-retry policy). The recovery-code redeem
    // route additionally enforces a per-user cap inside the handler via
    // checkRecoveryCodePerUserRateLimit.
    enabled: false,
  },
  secret: envSchema.BETTER_AUTH_SECRET,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: COOKIE_CACHE_MAX_AGE_SECONDS,
    },
  },
  trustedOrigins: TRUSTED_ORIGINS,
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ newEmail, url }) => {
        await sendChangeEmailConfirmation(newEmail, url);
      },
    },
  },
});

export type BetterAuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;
