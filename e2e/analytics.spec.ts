import { createLink, deleteLink, expect, test } from "./fixtures/auth";
import { t } from "./fixtures/i18n";
import { testUsers } from "./fixtures/test-users";

test.describe("analytics", () => {
  test("shows empty state when user has no clicks", async ({ freeUser: page }) => {
    //* Act
    await page.goto("/dashboard/analytics");

    //* Assert
    await expect(page.getByText(t.noClickDataYet)).toBeVisible();
  });

  test("records click via link redirect and shows analytics data", async ({ browser, proUser: page }) => {
    //* Arrange — create a link with a known slug
    await createLink(page, "Analytics Test", "https://example.com", "e2e-analytics");

    //* Act — visit the redirect URL in a separate context to generate a click
    const clickContext = await browser.newContext();
    const clickPage = await clickContext.newPage();
    await clickPage.goto(`/${testUsers.pro.username}/e2e-analytics`, { waitUntil: "commit" });
    await clickContext.close();
    await page.waitForTimeout(3000);
    await page.goto("/dashboard/analytics");

    //* Assert — analytics components render (click may still be processing)
    const totalClicks = page.getByText(t.totalClicks);
    const emptyState = page.getByText(t.noClickDataYet);
    const result = await Promise.race([
      totalClicks.waitFor({ timeout: 10_000 }).then(() => "data" as const),
      emptyState.waitFor({ timeout: 10_000 }).then(() => "empty" as const),
    ]);

    if (result === "empty") {
      await page.waitForTimeout(3000);
      await page.reload();
    }

    await expect(totalClicks).toBeVisible();
    await expect(page.getByText(t.clicksOverTime)).toBeVisible();

    //* Arrange — cleanup
    await page.goto("/dashboard");
    await deleteLink(page, "Analytics Test");
  });
});
