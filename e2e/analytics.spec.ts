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

  test("records click via link redirect and shows analytics data", async ({
    browser,
    proUser: page,
  }) => {
    //* Arrange — create a link with a known slug
    await createLink(page, "Analytics Test", "https://example.com", "e2e-analytics");

    //* Act — visit the redirect URL in a separate context to generate a click
    const clickContext = await browser.newContext();
    const clickPage = await clickContext.newPage();
    await clickPage.goto(`/${testUsers.pro.username}/e2e-analytics`, {
      waitUntil: "commit",
    });
    await clickContext.close();

    //* Assert — poll analytics page until click data appears
    // The click insert is fire-and-forget, and the analytics page
    // makes parallel DB queries that can fail transiently on Neon.
    // Retry navigation up to 3 times with increasing backoff.
    let dataVisible = false;

    for (let attempt = 1; attempt <= 3; attempt++) {
      await page.waitForTimeout(attempt * 2000);
      await page.goto("/dashboard/analytics");

      const totalClicks = page.getByText(t.totalClicks);
      const errorHeading = page.getByRole("heading", {
        name: t.somethingWentWrong,
      });

      const outcome = await Promise.race([
        totalClicks.waitFor({ timeout: 10_000 }).then(() => "data" as const),
        errorHeading
          .waitFor({ timeout: 10_000 })
          .then(() => "error" as const),
        page
          .getByText(t.noClickDataYet)
          .waitFor({ timeout: 10_000 })
          .then(() => "empty" as const),
      ]);

      if (outcome === "data") {
        dataVisible = true;
        break;
      }
      // "empty" (click not yet recorded) or "error" (transient DB failure) → retry
    }

    expect(dataVisible).toBe(true);
    await expect(page.getByText(t.clicksOverTime)).toBeVisible();

    //* Arrange — cleanup
    await page.goto("/dashboard");
    await deleteLink(page, "Analytics Test");
  });
});
