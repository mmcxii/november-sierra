import { expect, test } from "./fixtures/auth";
import { t } from "./fixtures/i18n";

test.describe("sidebar navigation", () => {
  test("navigates between all dashboard pages via sidebar", async ({ proUser: page }) => {
    //* Act — navigate to Analytics
    await page.getByRole("link", { name: t.analytics }).click();

    //* Assert
    await expect(page).toHaveURL(/\/dashboard\/analytics/);
    await expect(page.getByRole("heading", { exact: true, name: t.analytics })).toBeVisible();

    //* Act — navigate to Settings
    await page.getByRole("link", { name: t.settings }).click();

    //* Assert
    await expect(page).toHaveURL(/\/dashboard\/settings/);
    await expect(page.getByRole("heading", { exact: true, name: t.settings })).toBeVisible();

    //* Act — navigate back to Links
    await page.getByRole("link", { exact: true, name: t.links }).click();

    //* Assert
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { exact: true, name: t.links })).toBeVisible();
  });

  test("share profile button opens QR code modal with download", async ({ proUser: page }) => {
    //* Act
    await page.getByRole("button", { name: t.shareProfile }).click();

    //* Assert
    await expect(page.getByRole("heading", { exact: true, name: t.qrCode })).toBeVisible();
    await expect(page.getByRole("button", { name: t.downloadPng })).toBeVisible();
  });

  test("free-tier user sees sidebar upgrade card with enabled Upgrade to Pro button", async ({ freeUser: page }) => {
    //* Act
    const sidebar = page.locator("aside").first();
    await sidebar.getByText(t.unlockMoreWithPro).waitFor();

    //* Assert
    await expect(sidebar.getByText(t.unlockMoreWithPro)).toBeVisible();
    await expect(sidebar.getByRole("button", { name: t.upgradeToPro })).toBeEnabled();
  });

  test("pro-tier user does not see sidebar upgrade card", async ({ proUser: page }) => {
    //* Act
    const sidebar = page.locator("aside").first();
    await sidebar.getByRole("link", { exact: true, name: t.links }).waitFor();

    //* Assert
    await expect(sidebar.getByText(t.unlockMoreWithPro)).toBeHidden();
    await expect(sidebar.getByRole("button", { name: t.upgradeToPro })).toBeHidden();
  });
});
