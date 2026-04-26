/**
 * Run-scoped test user identities for the BA-based E2E flow (post ANC-152).
 *
 * In CI, E2E_RUN_ID is set to the GitHub Actions run ID so parallel
 * PR runs never share user rows or public profile URLs. Locally it
 * defaults to "local" for a stable, predictable identity.
 *
 * Every user shares E2E_USER_PASSWORD; sign-in goes through BA's
 * credential endpoint via fixtures/auth.ts.
 */
const RUN_ID = process.env.E2E_RUN_ID ?? "local";

function buildUser(role: string) {
  return {
    email: `e2e-${role}-${RUN_ID}@anchr.to`,
    id: `e2e_${role}_${RUN_ID}`,
    role,
    username: `e2e${role}${RUN_ID}`,
  };
}

export const testDomain = {
  /** Run-scoped subdomain for custom short-url domain E2E tests (users.short_domain). */
  shortSubdomain: `${RUN_ID}-short-url.anchr-e2e-testing.site`,
  /** Run-scoped subdomain for custom profile domain E2E tests. */
  subdomain: `${RUN_ID}.anchr-e2e-testing.site`,
  /** Apex of the e2e testing domain, used as a stable destination URL for tests
   *  that exercise outbound URL validation (e.g. short-link creation). */
  url: "https://anchr-e2e-testing.site",
};

export const testUsers = {
  admin: buildUser("admin"),
  free: buildUser("free"),
  fresh: buildUser("fresh"),
  /**
   * Dedicated user for password-flow tests. Pre-cutover this used a
   * +clerk_test email suffix to bypass Clerk's email rate limit; under
   * BA we just give it a plain run-scoped email.
   */
  passwordPro: buildUser("passwordPro"),
  pro: buildUser("pro"),
} as const;

export const E2E_REFERRAL_CODE = `ANCHR-E2E${RUN_ID.toUpperCase().replace(/[^A-Z0-9]/g, "")}`;
