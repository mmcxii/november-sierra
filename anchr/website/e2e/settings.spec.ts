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
    await expect(page.getByText(t.upgradeToProToUseACustomDomain)).toBeVisible();
    await expect(page.getByText(t.upgradeToProToHideBranding)).toBeVisible();
    // Current Plan card exposes an enabled "Upgrade to Pro" button for free users.
    const main = page.getByRole("main");
    await expect(main.getByRole("button", { name: t.upgradeToPro })).toBeEnabled();
  });

  test("Pro user has manage billing button and referral code input", async ({ proUser: page }) => {
    //* Act
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

    //* Assert
    await expect(page.getByRole("button", { name: t.manageBilling })).toBeVisible();
    await expect(page.getByPlaceholder("ANCHR-XXXXXX")).toBeVisible();
    await expect(page.getByRole("button", { name: t.redeem })).toBeDisabled();
  });
});
