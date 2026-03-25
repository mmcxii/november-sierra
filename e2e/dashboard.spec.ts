import { expect, test } from "./fixtures/auth";

test.describe("dashboard", () => {
  test("redirects authenticated user from / to /dashboard", async ({ proUser: page }) => {
    //* Act
    await page.goto("/");

    //* Assert
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
