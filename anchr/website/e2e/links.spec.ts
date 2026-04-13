import { createLink, deleteLink, expect, saveLinkForm, test } from "./fixtures/auth";
import { TEST_AVATAR_URL, clearUserAvatar, setUserAvatar } from "./fixtures/db";
import { t } from "./fixtures/i18n";
import { testUsers } from "./fixtures/test-users";

test.describe("link CRUD", () => {
  test.describe.configure({ mode: "serial" });

  test("creates a new link", async ({ proUser: page }) => {
    //* Arrange
    await page.getByRole("heading", { exact: true, name: t.links }).waitFor();

    //* Act
    await page.getByRole("button", { exact: true, name: t.addLink }).click();
    await page.getByLabel(t.title).fill("Playwright Test Link");
    await page.getByLabel(t.url, { exact: true }).fill("https://example.com");
    await saveLinkForm(page);

    //* Assert
    await expect(page.getByText("Playwright Test Link")).toBeVisible();
  });

  test("edits an existing link", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard");
    await page.getByText("Playwright Test Link").waitFor();

    //* Act
    const linkCard = page.locator("li", { hasText: "Playwright Test Link" });
    await linkCard.getByRole("button", { name: t.actions }).click();
    await page.getByRole("menuitem", { name: t.editLink }).click();
    await page.getByLabel(t.title).clear();
    await page.getByLabel(t.title).fill("Edited Test Link");
    await saveLinkForm(page);

    //* Assert
    await expect(page.getByText("Edited Test Link")).toBeVisible();
    await expect(page.getByText("Playwright Test Link")).toBeHidden();
  });

  test("hides and shows a link", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard");
    await page.getByText("Edited Test Link").waitFor();
    const linkCard = page.locator("li", { hasText: "Edited Test Link" });

    //* Act — hide
    await linkCard.getByRole("button", { name: t.actions }).click();
    await page.getByRole("menuitem", { name: t.hideLink }).click();

    //* Assert
    await expect(linkCard.getByText(t.hidden, { exact: true })).toBeVisible();

    //* Act — show
    await linkCard.getByRole("button", { name: t.actions }).click();
    await page.getByRole("menuitem", { name: t.showLink }).click();

    //* Assert
    await expect(linkCard.getByText(t.hidden, { exact: true })).toBeHidden();
  });

  test("deletes a link via confirmation dialog", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard");
    await page.getByText("Edited Test Link").waitFor();

    //* Act
    const linkCard = page.locator("li", { hasText: "Edited Test Link" });
    await linkCard.getByRole("button", { name: t.actions }).click();
    await page.getByRole("menuitem", { name: t.deleteLink }).click();
    await page.getByRole("button", { name: t.delete }).click();

    //* Assert
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("Edited Test Link")).toBeHidden();
  });

  test("bulk selects and deletes multiple links", async ({ proUser: page }) => {
    //* Arrange — create two links
    await createLink(page, "Bulk Link A", "https://example.com/a");
    await createLink(page, "Bulk Link B", "https://example.com/b");

    //* Act
    await page.getByRole("checkbox", { name: t.selectAll }).check();
    await page.getByText(/\d+ selected/).waitFor();
    await page.getByRole("button", { name: t.deleteSelected }).click();
    await page.getByRole("button", { name: t.delete }).click();

    //* Assert
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("Bulk Link A")).toBeHidden({ timeout: 15_000 });
    await expect(page.getByText("Bulk Link B")).toBeHidden({ timeout: 15_000 });
  });
});

test.describe("advanced link features", () => {
  test("detects platform from URL and shows badge", async ({ proUser: page }) => {
    //* Act
    await page.getByRole("button", { exact: true, name: t.addLink }).click();
    await page.getByLabel(t.url, { exact: true }).fill("https://github.com/test");

    //* Assert
    const dialog = page.getByRole("dialog");
    await expect(dialog.locator("span", { hasText: "GitHub" })).toBeVisible();

    //* Arrange — close
    await page.keyboard.press("Escape");
  });

  test("toggles featured link badge on and off", async ({ proUser: page }) => {
    //* Arrange
    await createLink(page, "Featured Test", "https://example.com/featured");
    const linkCard = page.locator("li", { hasText: "Featured Test" });

    //* Act — feature
    await linkCard.getByRole("button", { name: t.actions }).click();
    await page.getByRole("menuitem", { name: t.featureLink }).click();

    //* Assert
    await expect(linkCard.getByText(t.featured, { exact: true })).toBeVisible();

    //* Act — unfeature
    await linkCard.getByRole("button", { name: t.actions }).click();
    await page.getByRole("menuitem", { name: t.unfeatureLink }).click();

    //* Assert
    await expect(linkCard.getByText(t.featured, { exact: true })).toBeHidden();

    //* Arrange — cleanup
    await deleteLink(page, "Featured Test");
  });

  test("opens QR code modal with style options and download", async ({ proUser: page }) => {
    //* Arrange
    await createLink(page, "QR Test", "https://example.com/qr");
    const linkCard = page.locator("li", { hasText: "QR Test" });

    //* Act
    await linkCard.getByRole("button", { name: t.actions }).click();
    await page.getByRole("menuitem", { name: t.qrCode }).click();

    //* Assert
    await expect(page.getByRole("button", { name: t.downloadPng })).toBeVisible();
    await expect(page.getByRole("button", { name: t.light })).toBeVisible();
    await expect(page.getByRole("button", { name: t.dark })).toBeVisible();

    //* Arrange — cleanup
    await page.keyboard.press("Escape");
    await deleteLink(page, "QR Test");
  });

  test("QR modal hides avatar option when user has no avatar", async ({ proUser: page }) => {
    //* Arrange
    await createLink(page, "QR Avatar Test", "https://example.com/qr-avatar");
    const linkCard = page.locator("li", { hasText: "QR Avatar Test" });

    //* Act
    await linkCard.getByRole("button", { name: t.actions }).click();
    await page.getByRole("menuitem", { name: t.qrCode }).click();

    //* Assert — avatar option should not exist (user has no avatar)
    await expect(page.getByRole("button", { name: t.anchor })).toBeVisible();
    await expect(page.getByRole("button", { name: t.none })).toBeVisible();
    await expect(page.getByRole("button", { name: t.avatar })).toBeHidden();

    //* Arrange — cleanup
    await page.keyboard.press("Escape");
    await deleteLink(page, "QR Avatar Test");
  });

  test("QR modal shows avatar option and renders preview when user has avatar", async ({ proUser: page }) => {
    //* Arrange — seed avatar URL directly in DB
    await setUserAvatar(testUsers.pro.username, TEST_AVATAR_URL);
    await createLink(page, "QR Avatar Visible", "https://example.com/qr-avatar-vis");
    const linkCard = page.locator("li", { hasText: "QR Avatar Visible" });

    //* Act — open QR modal and select avatar
    await linkCard.getByRole("button", { name: t.actions }).click();
    await page.getByRole("menuitem", { name: t.qrCode }).click();
    await page.getByRole("button", { name: t.avatar }).click();

    //* Assert — avatar option active, circular avatar img visible in preview
    await expect(page.getByRole("button", { name: t.avatar })).toHaveAttribute("data-active", "true");
    const dialog = page.getByRole("dialog");
    const avatarImg = dialog.locator("img.rounded-full[alt='']");
    await expect(avatarImg).toBeVisible();

    //* Arrange — cleanup
    await page.keyboard.press("Escape");
    await deleteLink(page, "QR Avatar Visible");
    await clearUserAvatar(testUsers.pro.username);
  });

  test("QR modal toggles between anchor and none logo options", async ({ proUser: page }) => {
    //* Arrange
    await createLink(page, "QR Toggle Test", "https://example.com/qr-toggle");
    const linkCard = page.locator("li", { hasText: "QR Toggle Test" });

    //* Act — open QR modal
    await linkCard.getByRole("button", { name: t.actions }).click();
    await page.getByRole("menuitem", { name: t.qrCode }).click();

    //* Assert — anchor is default, preview shows anchor SVG img
    const dialog = page.getByRole("dialog");
    const previewImg = dialog.locator("img[alt='']");
    await expect(page.getByRole("button", { name: t.anchor })).toHaveAttribute("data-active", "true");
    await expect(previewImg).toBeVisible();

    //* Act — switch to none
    await page.getByRole("button", { name: t.none }).click();

    //* Assert — no logo image in preview
    await expect(page.getByRole("button", { name: t.none })).toHaveAttribute("data-active", "true");
    await expect(previewImg).toBeHidden();

    //* Act — switch back to anchor
    await page.getByRole("button", { name: t.anchor }).click();

    //* Assert — anchor logo reappears
    await expect(previewImg).toBeVisible();

    //* Arrange — cleanup
    await page.keyboard.press("Escape");
    await deleteLink(page, "QR Toggle Test");
  });

  test("bulk hides and shows selected links", async ({ proUser: page }) => {
    //* Arrange
    await createLink(page, "Vis Link A", "https://example.com/vis-a");
    await createLink(page, "Vis Link B", "https://example.com/vis-b");
    const linkA = page.locator("li", { hasText: "Vis Link A" });
    const linkB = page.locator("li", { hasText: "Vis Link B" });

    //* Act — hide all
    await page.getByRole("checkbox", { name: t.selectAll }).check();
    await page.getByText(/\d+ selected/).waitFor();
    await page.getByRole("button", { name: t.hideSelected }).click();
    await page.waitForTimeout(3000);
    await page.reload();
    await page.getByRole("heading", { exact: true, name: t.links }).waitFor();

    //* Assert
    await expect(linkA.getByText(t.hidden, { exact: true })).toBeVisible();
    await expect(linkB.getByText(t.hidden, { exact: true })).toBeVisible();

    //* Act — select all and show
    await page.getByRole("checkbox", { name: t.selectAll }).check();
    await page.getByText(/\d+ selected/).waitFor();
    await page.getByRole("button", { name: t.showSelected }).click();
    await page.waitForTimeout(3000);
    await page.reload();
    await page.getByRole("heading", { exact: true, name: t.links }).waitFor();

    //* Assert
    await expect(linkA.getByText(t.hidden, { exact: true })).toBeHidden();
    await expect(linkB.getByText(t.hidden, { exact: true })).toBeHidden();

    //* Arrange — cleanup
    await page.getByRole("checkbox", { name: t.selectAll }).check();
    await page.getByText(/\d+ selected/).waitFor();
    await page.getByRole("button", { name: t.deleteSelected }).click();
    await page.getByRole("button", { name: t.delete }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  });
});
