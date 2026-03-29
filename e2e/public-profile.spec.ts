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

  test("profile page JSON-LD contains @graph with ProfilePage and ItemList", async ({ proUser: page }) => {
    //* Arrange — create a link so ItemList is non-empty
    await createLink(page, "JSON-LD Test Link", "https://github.com/alice");

    //* Act — visit the public profile
    await page.goto(`/${testUsers.pro.username}`);

    //* Assert — extract and validate JSON-LD
    const jsonLdContent = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLdContent).not.toBeNull();

    const jsonLd = JSON.parse(jsonLdContent ?? "");
    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@graph"]).toBeDefined();
    expect(Array.isArray(jsonLd["@graph"])).toBe(true);

    const profilePage = jsonLd["@graph"].find((e: Record<string, unknown>) => e["@type"] === "ProfilePage");
    const itemList = jsonLd["@graph"].find((e: Record<string, unknown>) => e["@type"] === "ItemList");

    expect(profilePage).toBeDefined();
    expect(profilePage.mainEntity["@type"]).toBe("Person");
    expect(profilePage.mainEntity.name).toBeTruthy();
    expect(profilePage.mainEntity.url).toBeTruthy();

    expect(itemList).toBeDefined();
    expect(itemList.itemListElement.length).toBeGreaterThan(0);
    expect(itemList.numberOfItems).toBeGreaterThan(0);

    //* Arrange — cleanup
    await page.goto("/dashboard");
    await deleteLink(page, "JSON-LD Test Link");
  });
});
