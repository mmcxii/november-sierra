import { createLink, deleteLink, expect, test } from "./fixtures/auth";
import { t } from "./fixtures/i18n";
import { testUsers } from "./fixtures/test-users";

test.describe("Pro feature gating", () => {
  test("free user does not see Add link group button", async ({ freeUser: page }) => {
    //* Act
    await page.getByRole("heading", { name: t.links }).waitFor();

    //* Assert — Add link exists but Add link group does not
    await expect(page.getByRole("button", { exact: true, name: t.addLink })).toBeVisible();
    await expect(page.getByRole("button", { name: t.addLinkGroup })).toBeHidden();
  });

  test("free user link card does not show Feature link menu item", async ({ freeUser: page }) => {
    //* Arrange — create a link as free user
    await createLink(page, "Free User Link", "https://example.com/free");
    const linkCard = page.locator("li", { hasText: "Free User Link" });

    //* Act — open actions menu
    await linkCard.getByRole("button", { name: t.actions }).click();

    //* Assert — Feature link is not in the menu
    await expect(page.getByRole("menuitem", { name: t.editLink })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: t.featureLink })).toBeHidden();

    //* Arrange — close menu and cleanup
    await page.keyboard.press("Escape");
    await deleteLink(page, "Free User Link");
  });

  test("hidden link does not appear on public profile", async ({ proUser: page }) => {
    //* Arrange — create and hide a link
    await createLink(page, "Invisible Link", "https://example.com/invisible");
    const linkCard = page.locator("li", { hasText: "Invisible Link" });
    await linkCard.getByRole("button", { name: t.actions }).click();
    await page.getByRole("menuitem", { name: t.hideLink }).click();
    await linkCard.getByText(t.hidden, { exact: true }).waitFor();

    //* Act — visit public profile
    await page.goto(`/${testUsers.pro.username}`);

    //* Assert — hidden link not rendered
    await expect(page.getByRole("link", { name: "Invisible Link" })).toBeHidden();

    //* Arrange — cleanup
    await page.goto("/dashboard");
    await deleteLink(page, "Invisible Link");
  });
});
