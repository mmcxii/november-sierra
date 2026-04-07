import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test as base, type Page } from "@playwright/test";
import { testUsers } from "./test-users";

type AuthFixtures = {
  adminUser: Page;
  freeUser: Page;
  freshUser: Page;
  /**
   * Signs in as the passwordPro user (has +clerk_test email).
   * Uses a direct Clerk REST API call instead of clerk.signIn() since
   * getUserList can't find emails with + in them.
   */
  passwordProUser: Page;
  proUser: Page;
};

const signInAs = async (page: Page, emailAddress: string) => {
  await page.goto("/");
  await clerk.signIn({ emailAddress, page });
  await page.goto("/dashboard");
  await page.waitForLoadState("domcontentloaded");
};

const signInOnly = async (page: Page, emailAddress: string) => {
  await page.goto("/");
  await clerk.signIn({ emailAddress, page });
};

/**
 * Sign in as a user by username via Clerk REST API + testing token.
 * This bypasses clerk.signIn()'s getUserList which can't find +clerk_test emails.
 */
const signInByUsername = async (page: Page, username: string) => {
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (secretKey == null) {
    throw new Error("CLERK_SECRET_KEY is required for signInByUsername");
  }

  // Find user by username via Clerk REST API
  const listRes = await fetch(`https://api.clerk.com/v1/users?username=${encodeURIComponent(username)}&limit=1`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });

  if (!listRes.ok) {
    throw new Error(`Failed to find user by username ${username}: ${listRes.status}`);
  }

  const users = (await listRes.json()) as { id: string }[];

  if (users.length === 0) {
    throw new Error(`No user found with username: ${username}`);
  }

  // Create sign-in token
  const tokenRes = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
    body: JSON.stringify({ expires_in_seconds: 300, user_id: users[0].id }),
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!tokenRes.ok) {
    throw new Error(`Failed to create sign-in token: ${tokenRes.status}`);
  }

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
 * Creates a link via the Add link dialog and waits for the dialog to close.
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
    await signInAs(page, testUsers.admin.email);
    await use(page);
  },
  freeUser: async ({ page }, use) => {
    await signInAs(page, testUsers.admin.email);
    await use(page);
  },
  freshUser: async ({ page }, use) => {
    await signInOnly(page, testUsers.fresh.email);
    await use(page);
  },
  passwordProUser: async ({ page }, use) => {
    await signInByUsername(page, testUsers.passwordPro.username);
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await use(page);
  },
  proUser: async ({ page }, use) => {
    await signInAs(page, testUsers.pro.email);
    await use(page);
  },
});

export { expect };
