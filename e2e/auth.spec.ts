import { expect, test } from "@playwright/test";
import { t } from "./fixtures/i18n";

test.describe("route protection", () => {
  test("redirects unauthenticated users away from /dashboard", async ({ page }) => {
    //* Act
    await page.goto("/dashboard");

    //* Assert
    await expect(page).toHaveURL(/redirect_url/);
  });

  test("sign-in page renders functional form with sign-up link", async ({ page }) => {
    //* Act
    await page.goto("/sign-in");

    //* Assert
    await expect(page.getByLabel(t.email)).toBeVisible();
    await expect(page.getByLabel(t.password)).toBeVisible();
    await expect(page.getByRole("button", { name: t.continue })).toBeVisible();
    await expect(page.getByRole("link", { name: t.signUp })).toHaveAttribute("href", "/sign-up");
  });
});
