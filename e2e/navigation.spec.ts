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
    await page.getByRole("link", { name: t.links }).click();

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
});
