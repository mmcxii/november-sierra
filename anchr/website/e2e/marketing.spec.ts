import { expect, test } from "@playwright/test";
import { t } from "./fixtures/i18n";

test.describe("marketing landing page", () => {
  test("hero CTAs link to correct auth pages", async ({ page }) => {
    //* Act
    await page.goto("/");

    //* Assert
    const getStartedLink = page.getByRole("link", { name: t.getStarted }).first();
    await expect(getStartedLink).toHaveAttribute("href", "/sign-up");

    const signInLink = page.getByRole("link", { name: t.signIn }).first();
    await expect(signInLink).toHaveAttribute("href", "/sign-in");
  });

  test("footer contains legal compliance links", async ({ page }) => {
    //* Act
    await page.goto("/");

    //* Assert
    await expect(page.getByRole("link", { name: t.privacyPolicy })).toBeVisible();
    await expect(page.getByRole("link", { name: t.termsOfService })).toBeVisible();
  });
});
