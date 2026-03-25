import { createLink, deleteLink, expect, test } from "./fixtures/auth";
import { testUsers } from "./fixtures/test-users";

test.describe("public profile", () => {
  test("displays created links on public profile page", async ({ proUser: page }) => {
    //* Arrange — create a link
    await createLink(page, "Public Page Link", "https://example.com/public");

    //* Act — visit the public profile
    await page.goto(`/${testUsers.pro.username}`);

    //* Assert — link is visible on the public page
    await expect(page.getByRole("link", { name: "Public Page Link" })).toBeVisible();

    //* Arrange — cleanup
    await page.goto("/dashboard");
    await deleteLink(page, "Public Page Link");
  });

  test("link redirect sends user to target URL", async ({ browser, proUser: page }) => {
    //* Arrange — create a link with a known slug
    await createLink(page, "Redirect Test", "https://example.com", "e2e-redirect");

    //* Act — visit the redirect URL in a new context
    const context = await browser.newContext();
    const redirectPage = await context.newPage();
    await redirectPage.goto(`/${testUsers.pro.username}/e2e-redirect`, {
      waitUntil: "commit",
    });

    //* Assert — redirected to the target URL
    await expect(redirectPage).toHaveURL(/example\.com/);
    await context.close();

    //* Arrange — cleanup
    await deleteLink(page, "Redirect Test");
  });
});
