import { expect, test } from "./fixtures/auth";
import { t } from "./fixtures/i18n";

test.describe("onboarding flow", () => {
  test.describe.configure({ mode: "serial" });

  test("redirects non-onboarded user to /onboarding", async ({ freshUser: page }) => {
    //* Act
    await page.goto("/dashboard");

    //* Assert
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test("username step validates availability and advances to link step", async ({ freshUser: page }) => {
    //* Arrange
    await page.goto("/onboarding");
    await page.getByText(t.chooseYourUsername).waitFor();

    //* Act
    const usernameInput = page.getByPlaceholder("your_username");
    await usernameInput.clear();
    const uniqueUsername = `e2eob${Date.now()}`;
    await usernameInput.fill(uniqueUsername);
    await page.getByText(t.usernameIsAvailable).waitFor();
    await page.getByRole("button", { name: t.continue }).click();

    //* Assert
    await expect(page.getByText(t.addYourFirstLink)).toBeVisible();
  });

  test("link step accepts first link and advances to theme step", async ({ freshUser: page }) => {
    //* Arrange
    await page.goto("/onboarding?step=link");
    await page.getByText(t.addYourFirstLink).waitFor();

    //* Act
    await page.getByPlaceholder("My Website").fill("My First Link");
    await page.locator("#linkUrl").fill("https://example.com");
    await page.getByRole("button", { name: t.continue }).click();

    //* Assert
    await expect(page.getByText(t.pickATheme)).toBeVisible();
  });

  test("theme step completes onboarding and reaches dashboard", async ({ freshUser: page }) => {
    //* Arrange
    await page.goto("/onboarding?step=theme");
    await page.getByText(t.pickATheme).waitFor();

    //* Act
    await page.getByRole("button", { name: t.continue }).click();

    //* Assert — either complete step or dashboard (onboarding redirects)
    await expect(page).toHaveURL(/\/(onboarding|dashboard)/);

    const goToDashboard = page.getByRole("link", {
      name: t.goToDashboard,
    });
    if (await goToDashboard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await goToDashboard.click();
    }

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: t.links })).toBeVisible();
  });
});
