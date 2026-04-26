import { expect, test as base, type BrowserContext, type Page } from "@playwright/test";
import { testUsers } from "./test-users";

type AuthFixtures = {
  adminUser: Page;
  freeUser: Page;
  freshUser: Page;
  passwordProUser: Page;
  proUser: Page;
};

/**
 * Sign in a seeded user via BA's credential endpoint. Uses the context-bound
 * request API so Set-Cookie headers (Secure / SameSite / path) persist into
 * the browser context — a raw Node fetch loses them and the cookie injection
 * fails to carry through to page.goto.
 *
 * Exported so smoke tests that spin up transient users can reuse it.
 */
export async function signInUser(
  context: BrowserContext,
  baseURL: string,
  email: string,
  password: string,
): Promise<void> {
  const res = await context.request.post(`${baseURL}/api/v1/auth/sign-in/email`, {
    data: { email, password },
    // BA's origin check rejects mutating POSTs without an Origin header.
    headers: { "content-type": "application/json", origin: new URL(baseURL).origin },
  });

  if (!res.ok()) {
    const body = await res.text().catch(() => "<unreadable>");
    throw new Error(`BA sign-in failed for ${email} (${res.status()}): ${body}`);
  }
}

/**
 * Sign in by role and navigate to /dashboard. Centralizes the sign-in →
 * navigate → wait-for-hydration sequence so individual tests don't race.
 */
async function signInRoleToDashboard(
  context: BrowserContext,
  page: Page,
  baseURL: string,
  email: string,
): Promise<void> {
  const password = process.env.E2E_USER_PASSWORD;
  if (password == null) {
    throw new Error("E2E_USER_PASSWORD is required for the auth fixture");
  }
  await signInUser(context, baseURL, email, password);
  await page.goto("/dashboard");
  await page.waitForLoadState("domcontentloaded");
}

/**
 * Sign in only — no /dashboard navigation. Used for the fresh user (whose
 * onboarding flow expects the first dashboard request to redirect to
 * /onboarding) and any test that wants to control its own first navigation.
 */
async function signInRole(context: BrowserContext, baseURL: string, email: string): Promise<void> {
  const password = process.env.E2E_USER_PASSWORD;
  if (password == null) {
    throw new Error("E2E_USER_PASSWORD is required for the auth fixture");
  }
  await signInUser(context, baseURL, email, password);
}

/**
 * Reset a user's password to the seed-time default, used by tests that
 * mutate the password (update-password, password-section). Pre-cutover this
 * called Clerk's PATCH /v1/users/{id}; under BA we hit the
 * `auth.api.setPassword` adapter via direct DB write.
 *
 * Implemented as a direct ba_account update so we don't have to spin up a
 * BA server context inside the test runner.
 */
export async function restorePasswordByEmail(email: string, password: string): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl == null) {
    return;
  }

  // Lazy-load the heavy modules so non-password specs don't pay the cost.
  const [{ neon }, { drizzle }, { hash: argon2Hash }, drizzleOrm, schema] = await Promise.all([
    import("@neondatabase/serverless"),
    import("drizzle-orm/neon-http"),
    import("@node-rs/argon2"),
    import("drizzle-orm"),
    import("drizzle-orm/pg-core"),
  ]);

  const baUserTable = schema.pgTable("ba_user", {
    email: schema.text("email").notNull(),
    id: schema.text("id").primaryKey(),
  });
  const baAccountTable = schema.pgTable("ba_account", {
    id: schema.text("id").primaryKey(),
    password: schema.text("password"),
    providerId: schema.text("provider_id").notNull(),
    userId: schema.text("user_id").notNull(),
  });

  const db = drizzle(neon(databaseUrl));
  const [user] = await db
    .select({ id: baUserTable.id })
    .from(baUserTable)
    .where(drizzleOrm.eq(baUserTable.email, email))
    .limit(1);
  if (user == null) {
    return;
  }

  const passwordHash = await argon2Hash(password, { memoryCost: 8, outputLen: 32, parallelism: 1, timeCost: 1 });
  await db
    .update(baAccountTable)
    .set({ password: passwordHash })
    .where(
      drizzleOrm.and(
        drizzleOrm.eq(baAccountTable.userId, user.id),
        drizzleOrm.eq(baAccountTable.providerId, "credential"),
      ),
    );
}

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
 * waits for the new link row to appear in the list.
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

export const test = base.extend<AuthFixtures>({
  adminUser: async ({ baseURL, browser }, use) => {
    if (baseURL == null) {
      throw new Error("baseURL is required for the auth fixture");
    }
    const context = await browser.newContext();
    const page = await context.newPage();
    await signInRoleToDashboard(context, page, baseURL, testUsers.admin.email);
    await use(page);
    await context.close();
  },
  freeUser: async ({ baseURL, browser }, use) => {
    if (baseURL == null) {
      throw new Error("baseURL is required for the auth fixture");
    }
    const context = await browser.newContext();
    const page = await context.newPage();
    await signInRoleToDashboard(context, page, baseURL, testUsers.free.email);
    await use(page);
    await context.close();
  },
  freshUser: async ({ baseURL, browser }, use) => {
    if (baseURL == null) {
      throw new Error("baseURL is required for the auth fixture");
    }
    const context = await browser.newContext();
    const page = await context.newPage();
    await signInRole(context, baseURL, testUsers.fresh.email);
    await use(page);
    await context.close();
  },
  passwordProUser: async ({ baseURL, browser }, use) => {
    if (baseURL == null) {
      throw new Error("baseURL is required for the auth fixture");
    }
    const context = await browser.newContext();
    const page = await context.newPage();
    await signInRoleToDashboard(context, page, baseURL, testUsers.passwordPro.email);
    await use(page);
    await context.close();
  },
  proUser: async ({ baseURL, browser }, use) => {
    if (baseURL == null) {
      throw new Error("baseURL is required for the auth fixture");
    }
    const context = await browser.newContext();
    const page = await context.newPage();
    await signInRoleToDashboard(context, page, baseURL, testUsers.pro.email);
    await use(page);
    await context.close();
  },
});

export { expect };
