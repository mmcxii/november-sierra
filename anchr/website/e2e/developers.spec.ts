import { expect, test } from "@playwright/test";
import { t } from "./fixtures/i18n";

test.describe("developers page", () => {
  test("renders all content sections", async ({ page }) => {
    //* Act
    await page.goto("/developers");

    //* Assert
    await expect(page.getByRole("heading", { exact: true, name: t.builtForTheAiAgentEra })).toBeVisible();
    await expect(page.getByRole("heading", { exact: true, name: t.keyCapabilities })).toBeVisible();
    await expect(page.getByRole("heading", { exact: true, name: t.codeExamples })).toBeVisible();
    await expect(
      page.getByRole("heading", { exact: true, name: t.otherLinkPlatformsWerentBuiltForTheAiEra }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { exact: true, name: t.getYourApiKey })).toBeVisible();
  });

  test("try it button fetches a real public profile", async ({ page }) => {
    //* Arrange
    await page.goto("/developers");

    //* Act
    await page.getByRole("button", { name: t.fetchProfile }).click();

    //* Assert
    const responseBlock = page.getByTestId("try-api-response").locator("code");
    await expect(responseBlock).toBeVisible({ timeout: 10_000 });
    const text = await responseBlock.textContent();
    expect(text).toContain("username");
    expect(text).toContain("profileUrl");
  });

  test("try it shows error for nonexistent user", async ({ page }) => {
    //* Arrange
    await page.goto("/developers");
    const input = page.getByPlaceholder(t.enterAUsername);
    await input.clear();
    await input.fill("this-user-definitely-does-not-exist-12345");

    //* Act
    await page.getByRole("button", { name: t.fetchProfile }).click();

    //* Assert
    await expect(page.getByText(/no profile found/i)).toBeVisible({ timeout: 10_000 });
  });

  test("code tabs switch between examples", async ({ page }) => {
    //* Arrange
    await page.goto("/developers");

    //* Act
    await page.getByRole("button", { name: t.javascript }).click();

    //* Assert
    await expect(page.locator("pre code").filter({ hasText: "fetch" }).first()).toBeVisible();
  });

  test("nav links are present", async ({ page }) => {
    //* Act
    await page.goto("/developers");

    //* Assert
    const nav = page.getByRole("banner").getByRole("navigation");
    await expect(nav.getByRole("link", { name: t.home })).toBeVisible();
    await expect(nav.getByRole("link", { name: t.developers })).toBeVisible();
    await expect(nav.getByRole("link", { name: t.pricing })).toBeVisible();
    await expect(nav.getByRole("link", { name: t.signUp })).toBeVisible();
  });
});
