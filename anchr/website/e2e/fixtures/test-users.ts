/**
 * Run-scoped test user identities.
 *
 * In CI, E2E_RUN_ID is set to the GitHub Actions run ID so parallel
 * PR runs never share Clerk users, DB rows, or public profile URLs.
 * Locally it defaults to "local" for a stable, predictable identity.
 */
const RUN_ID = process.env.E2E_RUN_ID ?? "local";

export const testDomain = {
  /** Run-scoped subdomain for custom domain E2E tests. */
  subdomain: `${RUN_ID}.anchr-e2e-testing.site`,
};

export const testUsers = {
  admin: {
    email: `e2e-admin-${RUN_ID}@anchr.to`,
    username: `e2eadmin${RUN_ID}`,
  },
  fresh: {
    email: `e2e-fresh-${RUN_ID}@anchr.to`,
    username: `e2efresh${RUN_ID}`,
  },
  /**
   * Dedicated user for password tests. Uses +clerk_test email suffix
   * so Clerk skips real email delivery and bypasses the 100/month
   * dev instance email limit. Cannot use clerk.signIn() — use
   * the passwordProUser fixture from fixtures/auth.ts instead.
   */
  passwordPro: {
    email: `e2e-password-${RUN_ID}+clerk_test@anchr.to`,
    username: `e2epassword${RUN_ID}`,
  },
  pro: {
    email: `e2e-pro-${RUN_ID}@anchr.to`,
    username: `e2epro${RUN_ID}`,
  },
} as const;

export const E2E_REFERRAL_CODE = `ANCHR-E2E${RUN_ID.toUpperCase().replace(/[^A-Z0-9]/g, "")}`;
