import { expect, saveLinkForm, test } from "./fixtures/auth";
import { t } from "./fixtures/i18n";

test.describe("link group management", () => {
  test.describe.configure({ mode: "serial" });

  test("creates a link group", async ({ proUser: page }) => {
    //* Arrange
    await page.getByRole("heading", { name: t.links }).waitFor();

    //* Act
    await page.getByRole("button", { name: t.addLinkGroup }).click();
    await page.getByLabel(t.groupName).fill("Test Group");
    await page.getByRole("button", { exact: true, name: t.save }).click();

    //* Assert
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("Test Group")).toBeVisible();
  });

  test("creates a link inside a group", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard");
    await page.getByText("Test Group").waitFor();

    //* Act
    await page.getByRole("button", { exact: true, name: t.addLink }).click();
    await page.getByLabel(t.title).fill("Grouped Link");
    await page.getByLabel(t.url, { exact: true }).fill("https://example.com/grouped");
    await page.locator("#link-group").selectOption({ label: "Test Group" });
    await saveLinkForm(page);

    //* Assert
    await expect(page.getByText("Grouped Link")).toBeVisible();
  });

  test("toggles group visibility", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard");
    await page.getByRole("heading", { name: t.links }).waitFor();

    //* Act — hide the group via the eye icon next to "Test Group"
    // Quick Links also has a "Hide link" button, so we need the second one
    const hideButtons = page.getByLabel(t.hideLink);
    const testGroupHideButton = hideButtons.nth(1);
    await testGroupHideButton.click();

    //* Assert — button changes to "Show link"
    const showButtons = page.getByLabel(t.showLink);
    await expect(showButtons.first()).toBeVisible();

    //* Act — show the group again
    await showButtons.first().click();

    //* Assert — button reverts to "Hide link"
    await expect(hideButtons.nth(1)).toBeVisible();
  });

  test("edits a group name", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard");
    await page.getByText("Test Group").waitFor();

    //* Act
    await page.getByRole("button", { name: t.editLinkGroup }).click();
    await page.getByLabel(t.groupName).clear();
    await page.getByLabel(t.groupName).fill("Renamed Group");
    await page.getByRole("button", { exact: true, name: t.save }).click();

    //* Assert
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("Renamed Group")).toBeVisible();
    await expect(page.getByText("Test Group")).toBeHidden();
  });

  test("deletes a group and ungroups its links", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard");
    await page.getByText("Renamed Group").waitFor();

    //* Act
    await page.getByRole("button", { name: t.deleteLinkGroup }).click();
    await page.getByRole("button", { name: t.ungroupLinks }).click();

    //* Assert — group gone, link remains
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("Renamed Group")).toBeHidden();
    await expect(page.getByText("Grouped Link")).toBeVisible();

    //* Arrange — cleanup the orphaned link
    const linkCard = page.locator("li", { hasText: "Grouped Link" });
    await linkCard.getByRole("button", { name: t.actions }).click();
    await page.getByRole("menuitem", { name: t.deleteLink }).click();

    //* Act — confirm deletion
    await page.getByRole("button", { name: t.delete }).click();

    //* Assert
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
