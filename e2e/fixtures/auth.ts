import { clerk } from "@clerk/testing/playwright";
import { expect, test as base, type Page } from "@playwright/test";
import { testUsers } from "./test-users";

type AuthFixtures = {
  adminUser: Page;
  freeUser: Page;
  freshUser: Page;
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
  proUser: async ({ page }, use) => {
    await signInAs(page, testUsers.pro.email);
    await use(page);
  },
});

export { expect };
