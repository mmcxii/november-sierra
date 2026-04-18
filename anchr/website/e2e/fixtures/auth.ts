import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test as base, type Page } from "@playwright/test";
import { testUsers } from "./test-users";

type AuthFixtures = {
  adminUser: Page;
  freeUser: Page;
  freshUser: Page;
  /**
   * Signs in as the passwordPro user (has +clerk_test email).
   * Reaches Clerk via username lookup + ticket strategy, the same path
   * every other fixture uses — see the migration note on `signInByUsername`.
   */
  passwordProUser: Page;
  proUser: Page;
};

/**
 * Fetch with a few retries on network / 5xx / connection errors. Clerk's
 * REST API is generally reliable but has occasional blips under load; a
 * small backoff here makes the e2e harness resilient without making real
 * failures hide longer than they should. 4xx responses short-circuit so
 * genuine configuration problems (bad secret key, bad username) still fail
 * fast and clearly.
 */
async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit,
  label: string,
  maxAttempts = 3,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(input, init);

      if (res.ok) {
        return res;
      }

      if (res.status >= 400 && res.status < 500) {
        // 4xx: caller's fault. Surface immediately with the response body
        // so the thrown error carries Clerk's diagnostic.
        const body = await res.text().catch(() => "<unreadable>");
        throw new Error(`${label} failed with ${res.status}: ${body}`);
      }

      // 5xx: transient. Fall through to retry.
      lastError = new Error(`${label} failed with ${res.status}`);
    } catch (err: unknown) {
      lastError = err;
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2 ** (attempt - 1) * 300));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/**
 * Sign in as a user by username via Clerk REST API + ticket strategy.
 *
 * Migration note: prior to this refactor every fixture except
 * `passwordProUser` used `clerk.signIn({ emailAddress })` from
 * `@clerk/testing/playwright`, which in turn uses `getUserList` to
 * resolve the email → userId. `getUserList` has two known problems:
 *
 *   1. Emails containing `+` (e.g. `+clerk_test` addresses) don't resolve.
 *   2. Under load it occasionally returns empty results for valid emails,
 *      producing flaky `No user found with email` failures across unrelated
 *      specs (theme, webhooks, update-password, short-links).
 *
 * Both problems vanish if we skip `getUserList` entirely and look up the
 * user by `username` via the authenticated REST API, then complete the
 * sign-in via the ticket strategy — exactly what this function does. Every
 * fixture now takes this path, so the flakiness stops being visible to
 * test authors.
 *
 * Exported so smoke tests that spin up transient users can reuse it.
 */
export const signInByUsername = async (page: Page, username: string): Promise<void> => {
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (secretKey == null) {
    throw new Error("CLERK_SECRET_KEY is required for signInByUsername");
  }

  const listRes = await fetchWithRetry(
    `https://api.clerk.com/v1/users?username=${encodeURIComponent(username)}&limit=1`,
    { headers: { Authorization: `Bearer ${secretKey}` } },
    `Find user by username ${username}`,
  );

  const users = (await listRes.json()) as { id: string }[];

  if (users.length === 0) {
    throw new Error(`No user found with username: ${username}`);
  }

  const tokenRes = await fetchWithRetry(
    "https://api.clerk.com/v1/sign_in_tokens",
    {
      body: JSON.stringify({ expires_in_seconds: 300, user_id: users[0].id }),
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    },
    "Create sign-in token",
  );

  const { token } = (await tokenRes.json()) as { token: string };

  await setupClerkTestingToken({ context: page.context() });
  await page.goto("/");
  await page.waitForFunction(() => window.Clerk?.loaded);

  // Sign in using the ticket strategy (matching @clerk/testing/playwright internals)
  const signInError = await page.evaluate(
    async ({ ticket }) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const clk = (window as any).Clerk;
        const result = await clk.client.signIn.create({ strategy: "ticket", ticket });

        if (result.status === "complete") {
          await clk.setActive({ session: result.createdSessionId });
        } else {
          return `Sign-in status: ${result.status}`;
        }

        return null;
      } catch (err: unknown) {
        return String(err);
      }
    },
    { ticket: token },
  );

  if (signInError != null) {
    throw new Error(`Sign-in via ticket failed: ${signInError}`);
  }

  await page.waitForFunction(() => window.Clerk?.user !== null, undefined, { timeout: 15_000 });
};

/**
 * Sign in by username AND navigate to /dashboard. Every fixture that
 * expects to land on the dashboard should prefer this over calling
 * signInByUsername directly and navigating itself — keeps the sequence
 * (sign in → navigate → wait for hydration) consistent.
 */
const signInByUsernameToDashboard = async (page: Page, username: string): Promise<void> => {
  await signInByUsername(page, username);
  await page.goto("/dashboard");
  await page.waitForLoadState("domcontentloaded");
};

/**
 * Clicks "Save" in the link form dialog and handles the URL reachability
 * check. If the server-side URL check fails (intermittent for external URLs),
 * the dialog stays open and shows a "Save anyway" checkbox. This helper
 * checks the box and clicks Save again so the dialog closes reliably.
 */
export async function saveLinkForm(page: Page) {
  await page.getByRole("button", { exact: true, name: "Save" }).click();

  const dialog = page.getByRole("dialog");
  const saveAnyway = page.getByText("Save anyway");

  // Wait for either the dialog to close (URL check passed) or the
  // "Save anyway" checkbox to appear (URL check failed).
  const closed = dialog.waitFor({ state: "hidden", timeout: 15_000 }).then(() => "closed" as const);
  const fallback = saveAnyway.waitFor({ state: "visible", timeout: 15_000 }).then(() => "fallback" as const);
  const result = await Promise.race([closed, fallback]);

  if (result === "fallback") {
    await saveAnyway.click();
    await page.getByRole("button", { exact: true, name: "Save" }).click();
    await expect(dialog).toBeHidden();
  }
}

/**
 * Creates a link via the Add link dialog, waits for the dialog to close, AND
 * waits for the new link row to appear in the list. saveLinkForm resolves as
 * soon as the server action completes, but the list's re-render is driven by
 * Next.js revalidation which can lag by hundreds of ms (more now that bio-link
 * creation also inserts a short_slugs row). Without this wait, callers that
 * immediately interact with the list (bulk checkboxes, etc.) race the render
 * and select a stale subset.
 *
 * Optionally sets a custom slug for predictable redirect URLs.
 */
export async function createLink(page: Page, title: string, url: string, slug?: string) {
  await page.getByRole("button", { exact: true, name: "Add link" }).click();
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("URL", { exact: true }).fill(url);
  if (slug != null) {
    const slugInput = page.locator("#link-slug");
    await slugInput.clear();
    await slugInput.fill(slug);
  }
  await saveLinkForm(page);
  await expect(page.locator("li", { hasText: title })).toBeVisible({ timeout: 10_000 });
}

/**
 * Deletes a link by title via the Actions dropdown menu.
 */
export async function deleteLink(page: Page, title: string) {
  const linkCard = page.locator("li", { hasText: title });
  await linkCard.getByRole("button", { name: "Actions" }).click();
  await page.getByRole("menuitem", { name: "Delete link" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
}

/**
 * Restore a user's password via the Clerk REST API.
 */
export async function restorePasswordByUsername(username: string, password: string) {
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (secretKey == null) {
    return;
  }

  const listRes = await fetch(`https://api.clerk.com/v1/users?username=${encodeURIComponent(username)}&limit=1`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });

  if (!listRes.ok) {
    return;
  }

  const users = (await listRes.json()) as { id: string }[];

  if (users.length === 0) {
    return;
  }

  await fetch(`https://api.clerk.com/v1/users/${users[0].id}`, {
    body: JSON.stringify({ password, skip_password_checks: true }),
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
}

export const test = base.extend<AuthFixtures>({
  adminUser: async ({ page }, use) => {
    await signInByUsernameToDashboard(page, testUsers.admin.username);
    await use(page);
  },
  freeUser: async ({ page }, use) => {
    await signInByUsernameToDashboard(page, testUsers.admin.username);
    await use(page);
  },
  freshUser: async ({ page }, use) => {
    await signInByUsername(page, testUsers.fresh.username);
    await use(page);
  },
  passwordProUser: async ({ page }, use) => {
    await signInByUsernameToDashboard(page, testUsers.passwordPro.username);
    await use(page);
  },
  proUser: async ({ page }, use) => {
    await signInByUsernameToDashboard(page, testUsers.pro.username);
    await use(page);
  },
});

export { expect };
