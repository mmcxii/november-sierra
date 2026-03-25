/**
 * Run-scoped test user identities.
 *
 * In CI, E2E_RUN_ID is set to the GitHub Actions run ID so parallel
 * PR runs never share Clerk users, DB rows, or public profile URLs.
 * Locally it defaults to "local" for a stable, predictable identity.
 */
const RUN_ID = process.env.E2E_RUN_ID ?? "local";

export const testUsers = {
  admin: {
    email: `e2e-admin-${RUN_ID}@anchr.io`,
    username: `e2eadmin${RUN_ID}`,
  },
  fresh: {
    email: `e2e-fresh-${RUN_ID}@anchr.io`,
    username: `e2efresh${RUN_ID}`,
  },
  pro: {
    email: `e2e-pro-${RUN_ID}@anchr.io`,
    username: `e2epro${RUN_ID}`,
  },
} as const;
