import { expect, test } from "./fixtures/auth";
import { t } from "./fixtures/i18n";

// Unique suffix per file execution so serial-block retries don't collide
const suffix = Date.now().toString(36);

test.describe("API key lifecycle", () => {
  test.describe.configure({ mode: "serial" });

  const keyName = `E2E Key ${suffix}`;

  test("creates a key, displays raw key once, and rejects duplicate names", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/api");
    await page.getByRole("heading", { exact: true, name: t.api }).waitFor();

    //* Act — open dialog and enter name
    await page.getByRole("button", { name: t.createKey }).click();
    await page.getByLabel(t.name).fill(keyName);
    await page.getByRole("button", { name: t.create }).click();

    //* Assert — raw key is shown
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("anc_k_")).toBeVisible();
    await expect(dialog.getByText(t.thisKeyWillOnlyBeShownOnce)).toBeVisible();

    //* Act — close dialog
    await dialog.getByRole("button", { name: t.done }).click();

    //* Assert — key appears in table masked, raw key is gone
    const keyRow = page.locator("tr", { hasText: keyName });
    await expect(keyRow).toBeVisible();
    await expect(keyRow.getByText(t.active)).toBeVisible();

    //* Act — try to create another key with the same name
    await page.getByRole("button", { name: t.createKey }).click();
    await page.getByLabel(t.name).fill(keyName);
    await page.getByRole("button", { name: t.create }).click();

    //* Assert — duplicate rejected
    await expect(page.getByText(t.anApiKeyWithThisNameAlreadyExists)).toBeVisible();

    //* Arrange — close dialog
    await page.keyboard.press("Escape");
  });

  test("revokes a key and shows it when toggle is enabled", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/api");
    await page.getByText(keyName).waitFor();

    //* Act — revoke
    await page.getByRole("button", { name: t.revoke }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible" });
    await dialog.getByRole("button", { name: t.revoke }).click();

    //* Assert — key hidden by default after revocation
    await expect(dialog).toBeHidden({ timeout: 10_000 });
    await expect(page.getByText(keyName)).toBeHidden();

    //* Act — enable revoked keys toggle
    await page.getByLabel(t.showRevokedKeys).check();

    //* Assert — revoked key visible with revoked status in its row
    const keyRow = page.locator("tr", { hasText: keyName });
    await expect(keyRow).toBeVisible();
    await expect(keyRow.getByText(t.revoked, { exact: true })).toBeVisible();
  });
});

test.describe("API key free tier limit", () => {
  test("enforces limit of 1 active key", async ({ freeUser: page }) => {
    const freeKeyName = `Free Key ${Date.now().toString(36)}`;

    //* Arrange — navigate, clean up leftover keys from prior attempts, create first key
    await page.goto("/dashboard/api");
    await page.getByRole("heading", { exact: true, name: t.api }).waitFor();

    const revokeButton = page.getByRole("button", { name: t.revoke });
    if (await revokeButton.isVisible().catch(() => false)) {
      await revokeButton.click();
      await page.getByRole("dialog").getByRole("button", { name: t.revoke }).click();
      await page.getByRole("dialog").waitFor({ state: "hidden" });
    }

    await page.getByRole("button", { name: t.createKey }).click();
    await page.getByLabel(t.name).fill(freeKeyName);
    await page.getByRole("button", { name: t.create }).click();

    // Wait for either the "Done" button (success) or an error message (transient DB failure),
    // then retry once if we got an error
    const dialog = page.getByRole("dialog");
    const doneButton = dialog.getByRole("button", { name: t.done });
    const errorText = page.getByText(t.somethingWentWrongPleaseTryAgain);
    await doneButton.or(errorText).waitFor({ state: "visible", timeout: 15_000 });

    if (await errorText.isVisible().catch(() => false)) {
      // Transient failure — close dialog, retry key creation
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: t.createKey }).click();
      await page.getByLabel(t.name).fill(freeKeyName);
      await page.getByRole("button", { name: t.create }).click();
      await doneButton.click();
    } else {
      await doneButton.click();
    }

    //* Act — try to create a second key
    await page.getByRole("button", { name: t.createKey }).click();
    await page.getByLabel(t.name).fill("Second Key");
    await page.getByRole("button", { name: t.create }).click();

    //* Assert
    await expect(page.getByText(t.youveReachedTheApiKeyLimitUpgradeToProForUnlimitedKeys)).toBeVisible();

    //* Arrange — close and revoke the key to leave clean state
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: t.revoke }).click();
    await page.getByRole("dialog").getByRole("button", { name: t.revoke }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  });
});
