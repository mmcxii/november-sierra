import { expect, test } from "./fixtures/auth";
import { t } from "./fixtures/i18n";

test.describe("nostr profile", () => {
  test.describe.configure({ mode: "serial" });

  test("nostr toggle reveals npub input and relay configuration", async ({ adminUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

    //* Act — toggle nostr on
    await page.getByRole("switch").click();

    //* Assert — npub input, relays section, and default relays are visible
    await expect(page.getByPlaceholder("npub1...")).toBeVisible();
    await expect(page.getByText(t.relays)).toBeVisible();
    await expect(page.locator('input[value="wss://relay.damus.io"]')).toBeVisible();
    await expect(page.locator('input[value="wss://relay.primal.net"]')).toBeVisible();
    await expect(page.locator('input[value="wss://nos.lol"]')).toBeVisible();
    await expect(page.locator('input[value="wss://relay.nostr.band"]')).toBeVisible();

    //* Cleanup — toggle back off
    await page.getByRole("switch").click();
  });

  test("toggling nostr on locks display name, bio, and avatar", async ({ adminUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

    //* Act — toggle nostr on
    await page.getByRole("switch").click();

    //* Assert — "Managed by Nostr profile" text appears and bio textarea is disabled
    const managedLabels = page.getByText(t.managedByNostrProfile);
    await expect(managedLabels.first()).toBeVisible();
    await expect(managedLabels.nth(1)).toBeVisible();
    await expect(page.locator("textarea")).toBeDisabled();

    //* Cleanup — toggle back off
    await page.getByRole("switch").click();
  });

  test("save button is disabled when nostr is toggled on without a preview", async ({ adminUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

    //* Act — toggle nostr on without entering an npub
    await page.getByRole("switch").click();

    //* Assert — save button is disabled because no preview has been fetched
    await expect(page.getByRole("button", { name: t.save })).toBeDisabled();

    //* Cleanup
    await page.getByRole("switch").click();
  });

  test("relay management: add and remove relays", async ({ adminUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();
    await page.getByRole("switch").click();
    const relayInputs = page.locator('input[placeholder="wss://..."]');

    //* Act — add a relay
    await page.getByRole("button", { name: t.addRelay }).click();

    //* Assert — 5 relays, add button hidden (max reached)
    await expect(relayInputs).toHaveCount(5);
    await expect(page.getByRole("button", { name: t.addRelay })).toBeHidden();

    //* Act — remove a relay
    const removeButtons = page.getByRole("button", { name: t.removeRelay });
    await removeButtons.first().click();

    //* Assert — back to 4 relays, add button visible again
    await expect(relayInputs).toHaveCount(4);
    await expect(page.getByRole("button", { name: t.addRelay })).toBeVisible();

    //* Cleanup
    await page.getByRole("switch").click();
  });

  test("toggling nostr off hides nostr fields", async ({ adminUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

    //* Act — toggle on, wait for fields, then toggle off
    await page.getByRole("switch").click();
    await page.getByPlaceholder("npub1...").waitFor();
    await page.getByRole("switch").click();

    //* Assert — nostr fields hidden, no disconnect button (was never saved)
    await expect(page.getByPlaceholder("npub1...")).toBeHidden();
    await expect(page.getByRole("button", { name: t.disconnectNostrProfile })).toBeHidden();
  });
});
