import { expect, test } from "./fixtures/auth";
import { deleteAllShortLinksForUser, findShortLinkByCustomSlug, setUserShortDomain } from "./fixtures/db";
import { t } from "./fixtures/i18n";
import { testDomain, testUsers } from "./fixtures/test-users";

/**
 * NEXT_PUBLIC_SHORT_DOMAIN is injected into the WebServer env in ci.yml
 * (anch.to). Match the produced short URL against it so the assertion
 * breaks if routing stops pointing at the configured short domain.
 */
const SHORT_URL_REGEX = /^https:\/\/anch\.to\/[a-z0-9]+$/;

/**
 * Set a React-controlled input's value the way React actually expects it to be
 * set by user input: invoke the native HTMLInputElement value setter (bypasses
 * React's internal _valueTracker), then dispatch a bubbling `input` event so
 * React's synthetic onChange fires and state updates.
 *
 * Playwright's fill() / pressSequentially() SHOULD work for controlled inputs
 * but empirically they can race with React's value-tracker reconciliation and
 * leave state unchanged — observed consistently on the custom-slug input here.
 * This helper is the canonical workaround.
 */
async function setReactInputValue(locator: import("@playwright/test").Locator, value: string) {
  await locator.evaluate((el, v) => {
    const input = el as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, v);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

/**
 * Wait for the DOM value of `locator` to equal `expected`. React commits state
 * asynchronously after setReactInputValue, and submit clicks fired before the
 * re-render capture stale closure state — this wait forces the re-render to
 * flush before we proceed. Preferred over expect().toHaveValue() in Arrange/Act
 * sections where the project's AAA lint rule disallows inline assertions.
 */
async function waitForInputValue(locator: import("@playwright/test").Locator, expected: string): Promise<void> {
  await locator.evaluate(
    (el, v) =>
      new Promise<void>((resolve, reject) => {
        const deadline = Date.now() + 5000;
        const check = () => {
          if ((el as HTMLInputElement).value === v) {
            resolve();
          } else if (Date.now() > deadline) {
            reject(new Error(`Input value "${(el as HTMLInputElement).value}" did not reach "${v}" within 5s`));
          } else {
            requestAnimationFrame(check);
          }
        };
        check();
      }),
    expected,
  );
}

test.describe("short links", () => {
  test.describe.configure({ mode: "serial" });

  test("navigates to the short links page", async ({ proUser: page }) => {
    //* Act
    await page.getByRole("link", { name: t.shortLinks }).click();

    //* Assert
    await expect(page.getByRole("heading", { exact: true, name: t.shortLinks })).toBeVisible();
  });

  test("shows the create form on empty state", async ({ proUser: page }) => {
    //* Arrange
    // Other specs (short-link-api, short-link-webhook) run alphabetically
    // before this one in the 1-worker e2e job and leave short_links behind
    // in the shared pro seed user. Purge them so the component renders the
    // empty-state branch (shortLinks.length === 0 && successMessages.length === 0).
    await deleteAllShortLinksForUser(testUsers.pro.username);
    // Use networkidle to ensure the "use client" component has hydrated — goto's
    // default `load` event fires before React client-side hydration completes.
    await page.goto("/dashboard/short-links", { waitUntil: "networkidle" });
    await page.getByRole("heading", { exact: true, name: t.shortLinks }).waitFor();

    //* Act — nothing; goto + hydrate is the trigger

    //* Assert
    await expect(page.getByLabel(t.destinationUrl)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { exact: true, name: t.shorten })).toBeVisible();
    // Empty state should NOT render the list-view "New Short Link" trigger.
    await expect(page.getByRole("button", { name: t.newShortLink })).toBeHidden();
  });

  test("creates a short link", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/short-links");
    await page.getByRole("heading", { exact: true, name: t.shortLinks }).waitFor();

    //* Act
    await page.getByLabel(t.destinationUrl).fill(testDomain.url);
    await page.getByRole("button", { exact: true, name: t.shorten }).click();

    //* Assert — success toast renders with a well-formed short URL on the
    //  configured short domain, and the table gained a row for the destination.
    const toast = page.getByTestId("short-link-success-toast");
    await expect(toast).toBeVisible();
    await expect(toast).toHaveText(SHORT_URL_REGEX);
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.locator("tbody tr").first()).toContainText(testDomain.url);
  });

  test("creates a short link and adds another", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/short-links");
    await page.getByRole("heading", { exact: true, name: t.shortLinks }).waitFor();
    const rowsBefore = await page.locator("tbody tr").count();
    const toastsBefore = await page.getByTestId("short-link-success-toast").count();

    //* Act
    await page.getByRole("button", { name: t.newShortLink }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(t.destinationUrl).fill(testDomain.url);
    await dialog.getByRole("button", { name: t.shortenAndAddAnother }).click();

    //* Assert — dialog stays open with a fresh form (URL input cleared);
    //  a new success toast stacks above any prior ones and a new row is added.
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel(t.destinationUrl)).toHaveValue("");
    await expect(page.getByTestId("short-link-success-toast")).toHaveCount(toastsBefore + 1);
    await expect(page.getByTestId("short-link-success-toast").first()).toHaveText(SHORT_URL_REGEX);
    await expect(page.locator("tbody tr")).toHaveCount(rowsBefore + 1);
  });

  test("creates a short link with a custom slug (Pro + verified short domain)", async ({ proUser: page }) => {
    //* Arrange — customSlug is gated behind a verified users.short_domain,
    //  since the custom-short-domain middleware path is the only resolver that
    //  consults customSlug. Seed the pre-verified domain via DB helper.
    await setUserShortDomain(testUsers.pro.username, testDomain.shortSubdomain);
    await page.goto("/dashboard/short-links");
    await page.getByRole("heading", { exact: true, name: t.shortLinks }).waitFor();
    const customSlug = `e2e-custom-${Date.now().toString(36)}`;

    //* Act — open the modal, expand options, set custom slug, submit.
    await page.getByRole("button", { name: t.newShortLink }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(t.destinationUrl).fill(testDomain.url);
    await dialog.getByRole("button", { name: new RegExp(`\\+ ${t.options}`) }).click();
    const slugInput = dialog.locator("#custom-slug");
    await slugInput.waitFor({ state: "visible" });
    // Three-layer defense against React controlled-input state not committing
    // before submit: (1) fill via Playwright's normal path, (2) re-apply via
    // native setter bypassing React's value-tracker, (3) assert the DOM value
    // matches — this last assertion also forces Playwright to poll until
    // React's re-render completes and the DOM reflects state.
    await slugInput.fill(customSlug);
    await setReactInputValue(slugInput, customSlug);
    await waitForInputValue(slugInput, customSlug);
    await dialog.getByRole("button", { exact: true, name: t.shorten }).click();

    //* Assert — creation succeeded AND the customSlug was persisted on the row.
    //  Note: for users on the default anch.to short domain, the success toast
    //  always shows the auto-gen slug — customSlug is only consulted by the
    //  custom-short-domain middleware branch. So UI text alone can't prove the
    //  customSlug made it through; a DB lookup is the authoritative check.
    await expect(page.getByTestId("short-link-success-toast").first()).toBeVisible();
    const persisted = await findShortLinkByCustomSlug({ customSlug, username: testUsers.pro.username });
    expect(persisted).not.toBeNull();
    expect(persisted?.customSlug).toBe(customSlug);

    //* Arrange — cleanup so the next test starts without a verified short domain.
    await setUserShortDomain(testUsers.pro.username, null);
  });

  test("rejects a duplicate custom slug", async ({ proUser: page }) => {
    //* Arrange — create a custom-slug link, then try to create another with the same slug.
    await setUserShortDomain(testUsers.pro.username, testDomain.shortSubdomain);
    await page.goto("/dashboard/short-links");
    await page.getByRole("heading", { exact: true, name: t.shortLinks }).waitFor();
    const customSlug = `e2e-dupe-${Date.now().toString(36)}`;

    await page.getByRole("button", { name: t.newShortLink }).click();
    let dialog = page.getByRole("dialog");
    await dialog.getByLabel(t.destinationUrl).fill(testDomain.url);
    await dialog.getByRole("button", { name: new RegExp(`\\+ ${t.options}`) }).click();
    let slugInput = dialog.locator("#custom-slug");
    await slugInput.waitFor({ state: "visible" });
    await slugInput.fill(customSlug);
    await setReactInputValue(slugInput, customSlug);
    await waitForInputValue(slugInput, customSlug);
    await dialog.getByRole("button", { exact: true, name: t.shorten }).click();
    // Wait for the first submission to land (toast with the slug) before the duplicate attempt.
    await page.getByTestId("short-link-success-toast").first().waitFor();

    //* Act — open the modal again and submit the same slug.
    await page.getByRole("button", { name: t.newShortLink }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel(t.destinationUrl).fill(testDomain.url);
    await dialog.getByRole("button", { name: new RegExp(`\\+ ${t.options}`) }).click();
    slugInput = dialog.locator("#custom-slug");
    await slugInput.waitFor({ state: "visible" });
    await slugInput.fill(customSlug);
    await setReactInputValue(slugInput, customSlug);
    await waitForInputValue(slugInput, customSlug);
    await dialog.getByRole("button", { exact: true, name: t.shorten }).click();

    //* Assert — dialog stays open with a visible error; no new toast stacks.
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/(already in use|already taken|taken)/i)).toBeVisible();

    //* Arrange — cleanup: remove the verified short domain.
    await setUserShortDomain(testUsers.pro.username, null);
  });

  test("custom slug field is disabled when the user has no verified short domain", async ({ proUser: page }) => {
    //* Arrange — pro user with NO short_domain configured (default state).
    await setUserShortDomain(testUsers.pro.username, null);
    await page.goto("/dashboard/short-links");
    await page.getByRole("heading", { exact: true, name: t.shortLinks }).waitFor();

    //* Act — open the modal and expand the options panel.
    await page.getByRole("button", { name: t.newShortLink }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: new RegExp(`\\+ ${t.options}`) }).click();

    //* Assert — custom-slug input is rendered but disabled, and the inline
    //  hint tells the user to configure a short domain in Settings.
    await expect(dialog.locator("#custom-slug")).toBeDisabled();
    await expect(dialog.getByText(t.customPathsRequireAVerifiedShortDomainConfigureOneInSettings)).toBeVisible();
  });

  test("deletes a short link", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/short-links");
    await page.getByRole("heading", { exact: true, name: t.shortLinks }).waitFor();
    const rowsBefore = await page.locator("tbody tr").count();
    const firstRow = page.locator("tbody tr").first();

    //* Act
    page.on("dialog", (dialog) => dialog.accept());
    await firstRow.getByTitle(t.delete).click();

    //* Assert
    await expect(page.getByText(t.shortLinkDeleted)).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(rowsBefore - 1);
  });
});

test.describe("short links pro gating", () => {
  test("free users cannot set a custom slug or password", async ({ freeUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/short-links");
    await page.getByRole("heading", { exact: true, name: t.shortLinks }).waitFor();

    //* Act — expand the Options section where the Pro-gated inputs live.
    await page.getByRole("button", { name: new RegExp(`\\+ ${t.options}`) }).click();

    //* Assert — both gated inputs are rendered but disabled for free users.
    await expect(page.locator("#custom-slug")).toBeDisabled();
    await expect(page.locator("#password")).toBeDisabled();
    // UTM builder is Pro-only and should not render at all.
    await expect(page.getByRole("button", { name: new RegExp(t.utmParameters) })).toBeHidden();
  });
});
