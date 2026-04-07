import { expect, test } from "./fixtures/auth";
import { t } from "./fixtures/i18n";
import { testUsers } from "./fixtures/test-users";

test.describe("docs page", () => {
  test("renders all content sections and resource groups", async ({ page }) => {
    //* Act
    await page.goto("/docs");

    //* Assert
    await expect(page.getByRole("heading", { exact: true, name: t.apiDocumentation })).toBeVisible();
    await expect(page.getByRole("heading", { exact: true, name: t.overview })).toBeVisible();
    await expect(page.getByRole("heading", { exact: true, name: t.authentication })).toBeVisible();
    await expect(page.getByRole("heading", { exact: true, name: t.rateLimits })).toBeVisible();
    await expect(page.getByRole("heading", { exact: true, name: "Profile" })).toBeVisible();
    await expect(page.getByRole("heading", { exact: true, name: "Links" })).toBeVisible();
    await expect(page.getByRole("heading", { exact: true, name: "Groups" })).toBeVisible();
    await expect(page.getByRole("heading", { exact: true, name: "Analytics" })).toBeVisible();
  });

  test("sidebar navigation is visible on desktop", async ({ page }) => {
    //* Arrange
    await page.setViewportSize({ height: 900, width: 1280 });

    //* Act
    await page.goto("/docs");

    //* Assert
    const sidebar = page.getByTestId("docs-sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByText(t.overview)).toBeVisible();
    await expect(sidebar.getByText(t.authentication)).toBeVisible();
    await expect(sidebar.getByText(t.rateLimits)).toBeVisible();
  });

  test("endpoint sections expand and collapse", async ({ page }) => {
    //* Arrange
    await page.goto("/docs");

    //* Act — expand getPublicProfile endpoint
    const toggle = page.getByTestId("endpoint-toggle-getPublicProfile");
    await toggle.scrollIntoViewIfNeeded();
    await toggle.click();

    //* Assert — details are visible
    const section = page.getByTestId("endpoint-getPublicProfile");
    await expect(section.getByText(t.codeExamples)).toBeVisible();

    //* Act — collapse
    await toggle.click();

    //* Assert — details are hidden
    await expect(section.getByText(t.codeExamples)).toBeHidden();
  });

  test("code example tabs switch between languages", async ({ page }) => {
    //* Arrange
    await page.goto("/docs");
    const toggle = page.getByTestId("endpoint-toggle-getPublicProfile");
    await toggle.scrollIntoViewIfNeeded();
    await toggle.click();

    //* Act — click JavaScript tab
    const section = page.getByTestId("endpoint-getPublicProfile");
    await section.getByRole("button", { name: t.javascript }).click();

    //* Assert — JavaScript code is visible
    await expect(section.locator("pre code").filter({ hasText: "fetch" }).first()).toBeVisible();
  });

  test("try it works for public endpoint without auth", async ({ page }) => {
    //* Arrange
    await page.goto("/docs");
    const toggle = page.getByTestId("endpoint-toggle-getPublicProfile");
    await toggle.scrollIntoViewIfNeeded();
    await toggle.click();

    //* Act — fill username and send
    const section = page.getByTestId("endpoint-getPublicProfile");
    const tryIt = section.getByTestId("try-it");
    await tryIt.locator('input[id="param-username"]').fill(testUsers.pro.username);
    await tryIt.getByRole("button", { name: t.send }).click();

    //* Assert — response contains profile data
    const responseBlock = tryIt.getByTestId("try-it-response").locator("code");
    await expect(responseBlock).toBeVisible({ timeout: 10_000 });
    const text = await responseBlock.textContent();
    expect(text).toContain("username");
    expect(text).toContain("profileUrl");
  });

  test("try it shows error for nonexistent user", async ({ page }) => {
    //* Arrange
    await page.goto("/docs");
    const toggle = page.getByTestId("endpoint-toggle-getPublicProfile");
    await toggle.scrollIntoViewIfNeeded();
    await toggle.click();

    //* Act
    const section = page.getByTestId("endpoint-getPublicProfile");
    const tryIt = section.getByTestId("try-it");
    await tryIt.locator('input[id="param-username"]').fill("this-user-definitely-does-not-exist-12345");
    await tryIt.getByRole("button", { name: t.send }).click();

    //* Assert
    await expect(tryIt.getByTestId("try-it-error")).toBeVisible({ timeout: 10_000 });
  });

  test("api key input accepts and masks a valid key", async ({ page }) => {
    //* Arrange
    await page.goto("/docs");

    //* Act — paste a fake API key
    const input = page.getByTestId("api-key-form").locator("input");
    await input.fill("anc_k_abcdefghijklmnopqrstuvwxyz123456");

    //* Assert — masked key is displayed automatically
    const display = page.getByTestId("api-key-display");
    await expect(display).toBeVisible();
    await expect(display.locator("code")).toContainText("anc_k_abcd");
    await expect(display.locator("code")).toContainText("3456");
  });

  test("authenticated try it works with real api key", async ({ proUser: page }) => {
    //* Arrange — create an API key via the dashboard
    const suffix = Date.now().toString(36);
    const keyName = `Docs E2E ${suffix}`;
    await page.goto("/dashboard/api");
    await page.getByRole("heading", { exact: true, name: t.api }).waitFor();
    await page.getByRole("button", { name: t.createKey }).click();
    await page.getByLabel(t.name).fill(keyName);
    await page.getByRole("button", { name: t.create }).click();

    // Wait for raw key to appear
    const dialog = page.getByRole("dialog");
    const rawKeyEl = dialog.getByText("anc_k_");
    await rawKeyEl.waitFor({ state: "visible", timeout: 15_000 });
    const rawKey = (await rawKeyEl.textContent()) ?? "";

    // Close dialog
    await dialog.getByRole("button", { name: t.done }).click();

    //* Act — navigate to docs and paste the key
    await page.goto("/docs");
    const input = page.getByTestId("api-key-form").locator("input");
    await input.fill(rawKey);

    // Wait for masked display to confirm key is set
    await page.getByTestId("api-key-display").waitFor({ state: "visible" });

    // Expand getMe endpoint and try it
    const toggle = page.getByTestId("endpoint-toggle-getMe");
    await toggle.scrollIntoViewIfNeeded();
    await toggle.click();

    const section = page.getByTestId("endpoint-getMe");
    const tryIt = section.getByTestId("try-it");
    await tryIt.getByRole("button", { name: t.send }).click();

    //* Assert — response contains authenticated user data
    const responseBlock = tryIt.getByTestId("try-it-response").locator("code");
    await expect(responseBlock).toBeVisible({ timeout: 10_000 });
    const text = await responseBlock.textContent();
    expect(text).toContain("username");

    //* Cleanup — revoke the API key
    await page.goto("/dashboard/api");
    const keyRow = page.locator("tr", { hasText: keyName });
    await keyRow.waitFor();
    await keyRow.getByRole("button", { name: t.revoke }).click();
    const revokeDialog = page.getByRole("dialog");
    await revokeDialog.waitFor({ state: "visible" });
    await revokeDialog.getByRole("button", { name: t.revoke }).click();
    await revokeDialog.waitFor({ state: "hidden", timeout: 10_000 });
  });
});
