import { test as base, type BrowserContext, type Page } from "@playwright/test";
import { testUsers } from "./test-users";

// Better Auth E2E fixture.
//
// Parallel to fixtures/auth.ts (Clerk). The seeded BA user is created by
// e2e/scripts/seed.ts during global setup (ba_user + ba_account + users
// rows). This fixture signs that user in via BA's credential endpoint and
// relies on Playwright's context-bound request API to persist the session
// cookies into the browser context automatically.
//
// Prerequisites for the test environment:
//  - e2e/scripts/seed.ts has run against the same DATABASE_URL.
//  - AUTH_WHITELIST_USER_IDS contains testUsers.betterAuth.id — without it,
//    the middleware + auth() shim won't treat the seeded user as a BA user.

type BetterAuthFixtures = {
  baWhitelistedUser: Page;
};

async function signInBetterAuthUser(context: BrowserContext, baseURL: string): Promise<void> {
  // Use the context-bound request API so Set-Cookie headers from the response
  // are automatically persisted into the browser context. The raw Node fetch
  // path we tried previously lost attributes like Secure / SameSite / path
  // and the cookie injection didn't carry through to page.goto.
  const res = await context.request.post(`${baseURL}/api/v1/auth/sign-in/email`, {
    data: {
      email: testUsers.betterAuth.email,
      password: testUsers.betterAuth.password,
    },
    // BA's origin check rejects mutating POSTs without an Origin header.
    // Playwright's request API doesn't set one by default.
    headers: {
      "content-type": "application/json",
      origin: new URL(baseURL).origin,
    },
  });
  if (!res.ok()) {
    const body = await res.text().catch(() => "<unreadable>");
    throw new Error(`BA sign-in failed (${res.status()}): ${body}`);
  }
}

export const test = base.extend<BetterAuthFixtures>({
  baWhitelistedUser: async ({ baseURL, browser }, use) => {
    if (baseURL == null) {
      throw new Error("baseURL is required for the better-auth fixture");
    }

    const context = await browser.newContext();
    await signInBetterAuthUser(context, baseURL);

    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
