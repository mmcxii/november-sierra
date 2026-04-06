import { expect, test } from "./fixtures/auth";
import { t } from "./fixtures/i18n";
import { testUsers } from "./fixtures/test-users";

test.describe("account deletion", () => {
  test("shows danger zone section on settings page", async ({ proUser: page }) => {
    //* Act
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

    //* Assert
    await expect(page.getByText(t.dangerZone)).toBeVisible();
    await expect(page.getByRole("button", { name: t.deleteAccount })).toBeVisible();
  });

  test("opens deletion dialog with account summary", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

    //* Act
    await page.getByRole("button", { name: t.deleteAccount }).click();

    //* Assert
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(t.thisActionCannotBeUndoneThisWillPermanentlyDelete)).toBeVisible();
    await expect(dialog.getByText(t.accountAge)).toBeVisible();
  });

  test("requires username to enable delete button", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();
    await page.getByRole("button", { name: t.deleteAccount }).click();
    await page.getByRole("dialog").waitFor();
    await page.getByRole("dialog").getByRole("button", { name: t.continue }).click();

    //* Act
    await page.getByRole("dialog").locator("input").fill("wrong-username");

    //* Assert
    const deleteButton = page.getByRole("button", { name: t.permanentlyDeleteAccount });
    await expect(deleteButton).toBeDisabled();
  });

  test("enables delete button when correct username is typed", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();
    await page.getByRole("button", { name: t.deleteAccount }).click();
    await page.getByRole("dialog").waitFor();
    await page.getByRole("dialog").getByRole("button", { name: t.continue }).click();

    //* Act
    await page.getByRole("dialog").locator("input").fill(testUsers.pro.username);

    //* Assert
    const deleteButton = page.getByRole("button", { name: t.permanentlyDeleteAccount });
    await expect(deleteButton).toBeEnabled();
  });

  test("shows danger zone for free users", async ({ freeUser: page }) => {
    //* Act
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

    //* Assert
    await expect(page.getByText(t.dangerZone)).toBeVisible();
    await expect(page.getByRole("button", { name: t.deleteAccount })).toBeVisible();
  });

  test("cancel button closes the dialog at summary step", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();
    await page.getByRole("button", { name: t.deleteAccount }).click();
    await page.getByRole("dialog").waitFor();

    //* Act
    await page.getByRole("dialog").getByRole("button", { name: t.cancel }).click();

    //* Assert
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
