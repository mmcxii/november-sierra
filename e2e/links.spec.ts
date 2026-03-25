import { createLink, deleteLink, expect, saveLinkForm, test } from "./fixtures/auth";
import { t } from "./fixtures/i18n";

test.describe("link CRUD", () => {
  test.describe.configure({ mode: "serial" });

  test("creates a new link", async ({ proUser: page }) => {
    //* Arrange
    await page.getByRole("heading", { name: t.links }).waitFor();

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

    //* Assert
    await expect(linkA.getByText(t.hidden, { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(linkB.getByText(t.hidden, { exact: true })).toBeVisible();

    //* Act — re-select all (selection clears after bulk action) and show
    await page.waitForTimeout(1000);
    await page.getByRole("checkbox", { name: t.selectAll }).check();
    await page.getByText(/\d+ selected/).waitFor();
    await page.getByRole("button", { name: t.showSelected }).click();

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
