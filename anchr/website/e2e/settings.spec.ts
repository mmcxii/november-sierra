import { expect, test } from "./fixtures/auth";
import { t } from "./fixtures/i18n";
import { testUsers } from "./fixtures/test-users";

test.describe("settings", () => {
  test("updates display name and bio with confirmation toast", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

    //* Act
    const displayNameInput = page.getByPlaceholder(testUsers.pro.username, {
      exact: true,
    });
    await displayNameInput.clear();
    await displayNameInput.fill("E2E Updated Name");

    const bioTextarea = page.locator("textarea");
    await bioTextarea.clear();
    await bioTextarea.fill("This is an E2E test bio.");
    await page.getByRole("button", { name: t.save }).click();

    //* Assert
    await expect(page.getByText(t.profileUpdated)).toBeVisible();

    //* Arrange — revert
    await displayNameInput.clear();
    await displayNameInput.fill("E2E pro");
    await bioTextarea.clear();

    //* Act
    await page.getByRole("button", { name: t.save }).click();

    //* Assert
    await expect(page.getByText(t.profileUpdated)).toBeVisible();
  });

  test("toggles branding visibility", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

    //* Act — hide
    await page.getByRole("button", { name: t.hideBranding }).click();

    //* Assert
    await expect(page.getByRole("button", { name: t.showBranding })).toBeVisible();

    //* Act — restore (wait for server action to complete)
    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: t.showBranding }).click();

    //* Assert
    await expect(page.getByRole("button", { name: t.hideBranding })).toBeVisible();
  });

  test("free-tier user sees upgrade prompts for Pro features", async ({ freeUser: page }) => {
    //* Act
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

    //* Assert
    // Both Profile and Short Links sections show the same upgrade prompt for free users.
    await expect(page.getByText(t.upgradeToProToUseACustomDomain)).toHaveCount(2);
    await expect(page.getByText(t.upgradeToProToHideBranding)).toBeVisible();
    // Current Plan card exposes annual + monthly upgrade buttons for free users.
    const main = page.getByRole("main");
    await expect(main.getByRole("button", { name: `${t.$5Mo} ${t.annual}` })).toBeEnabled();
    await expect(main.getByRole("button", { name: `${t.$7Mo} ${t.monthly}` })).toBeEnabled();
  });

  test("Pro user has manage billing button and referral code input", async ({ proUser: page }) => {
    //* Act
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

    //* Assert — seeded pro user has no Stripe customer, so shows lifetime pro text
    await expect(page.getByText(t.youHaveLifetimeProAccess)).toBeVisible();
    await expect(page.getByPlaceholder("ANCHR-XXXXXX")).toBeVisible();
    await expect(page.getByRole("button", { name: t.redeem })).toBeDisabled();
  });

  test("Custom Domains card renders Profile and Short Links sections", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

    //* Act — scope queries to the main content region so the sidebar nav links
    //  ("Short Links", etc.) don't collide with the card's section headings.
    const main = page.getByRole("main");
    const card = main.getByText(t.customDomains).locator("xpath=ancestor::*[contains(@class, 'rounded')][1]");
    await card.scrollIntoViewIfNeeded();

    //* Assert — both sub-sections are labelled; the profile input renders for
    //  the seeded pro user (no domain configured). Scoping to the card ensures
    //  we're asserting on the card's copy, not on page-level duplicates.
    await expect(card.getByText(t.customDomains)).toBeVisible();
    await expect(card.getByText(t.profile, { exact: true })).toBeVisible();
    await expect(card.getByText(t.shortLinks, { exact: true })).toBeVisible();
    // exact:true — the new short-domain input's placeholder "go.yourdomain.com"
    // partially matches "yourdomain.com" without this constraint.
    await expect(card.getByPlaceholder("yourdomain.com", { exact: true })).toBeVisible();
    await expect(card.getByPlaceholder("go.yourdomain.com")).toBeVisible();
  });
});
