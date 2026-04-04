import { expect, test } from "./fixtures/auth";
import { assignThemeSlotsDirectly, insertCustomTheme, resetCustomThemes, setUserTier } from "./fixtures/db";
import { t } from "./fixtures/i18n";
import { testUsers } from "./fixtures/test-users";

// ─── Free User ────────────────────────────────────────────────────────────────

test.describe("Theme Studio — Free User", () => {
  test("creates a theme with color pickers, Pro features are locked", async ({ freeUser: page }) => {
    //* Arrange
    await resetCustomThemes(testUsers.admin.username);
    await setUserTier(testUsers.admin.username, "free");
    await page.goto("/dashboard/theme");
    await page.getByRole("heading", { exact: true, name: t.theme }).waitFor();

    //* Act — navigate to studio and save a theme
    await page.getByRole("link", { name: t.createTheme }).click();
    await page.waitForURL("**/theme/studio/new**");
    await page.getByRole("button", { name: t.saveTheme }).click();

    //* Assert — theme saved, Pro inputs disabled
    await expect(page.getByText(t.themeCreated)).toBeVisible();
    await expect(page.getByPlaceholder("Inter")).toBeDisabled();
    await expect(page.locator('input[type="range"]')).toBeDisabled();
    await expect(page.getByText(t.upgradeToProToUseTheRawCssEditor)).toBeVisible();
  });

  test("cannot create more than 2 themes", async ({ freeUser: page }) => {
    //* Arrange — insert 2 themes via DB to reach the free limit
    await resetCustomThemes(testUsers.admin.username);
    await setUserTier(testUsers.admin.username, "free");
    await insertCustomTheme(testUsers.admin.username, { name: "Limit Test 1" });
    await insertCustomTheme(testUsers.admin.username, { name: "Limit Test 2" });

    //* Act — attempt to create a 3rd theme via UI
    await page.goto("/dashboard/theme/studio/new");
    await page.waitForLoadState("domcontentloaded");
    await page.getByRole("button", { name: t.saveTheme }).click();

    //* Assert
    await expect(page.getByText(t.themeLimitReached)).toBeVisible();
  });
});

// ─── Pro User ─────────────────────────────────────────────────────────────────

test.describe("Theme Studio — Pro User", () => {
  test("creates a theme with custom color, assigns it, and renders on public page", async ({ proUser: page }) => {
    //* Arrange
    await resetCustomThemes(testUsers.pro.username);
    await setUserTier(testUsers.pro.username, "pro");
    await page.goto("/dashboard/theme/studio/new");
    await page.waitForLoadState("domcontentloaded");

    //* Act — set a custom name-color, save, assign to slots, visit public page
    const nameColorInput = page.locator('input[type="text"][aria-label="Name color"]');
    await nameColorInput.clear();
    await nameColorInput.fill("#ff0000");
    await page.getByRole("button", { name: t.saveTheme }).click();
    await page.getByText(t.themeCreated).waitFor();
    await page.waitForURL(/\/theme\/studio\/[a-f0-9-]+/);
    const themeIdMatch = page.url().match(/studio\/([a-f0-9-]+)/);
    if (themeIdMatch == null) {
      throw new Error("Could not extract theme ID from redirect URL");
    }
    await assignThemeSlotsDirectly(testUsers.pro.username, themeIdMatch[1]);
    await page.goto(`/${testUsers.pro.username}`, { waitUntil: "domcontentloaded" });

    //* Assert — public page renders the custom theme with correct CSS variable
    const pageRoot = page.locator(".lp-page-bg");
    await expect(pageRoot).toHaveAttribute("data-theme", /custom-dark|custom-light/);
    const nameColor = await pageRoot.evaluate(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- browser context; e2e tsconfig lacks DOM types
      (el: any) => el.style.getPropertyValue("--anc-theme-name-color").trim(),
    );
    expect(nameColor).toBe("#ff0000");
  });

  test("has full editor access: font, border radius, raw CSS", async ({ proUser: page }) => {
    //* Arrange
    await resetCustomThemes(testUsers.pro.username);
    await setUserTier(testUsers.pro.username, "pro");

    //* Act
    await page.goto("/dashboard/theme/studio/new");
    await page.waitForLoadState("domcontentloaded");

    //* Assert — Pro inputs are enabled, raw CSS toggle is available
    await expect(page.getByPlaceholder("Inter")).toBeEnabled();
    await expect(page.locator('input[type="range"]')).toBeEnabled();
    await expect(page.getByRole("button", { name: t.showEditor })).toBeVisible();
  });

  test("cloning from a preset pre-populates variables", async ({ proUser: page }) => {
    //* Arrange — nothing to set up

    //* Act — navigate to studio with ?from=dark-depths
    await page.goto("/dashboard/theme/studio/new?from=dark-depths");
    await page.waitForLoadState("domcontentloaded");

    //* Assert — name color matches dark-depths preset (#ffffff)
    const nameColorInput = page.locator('input[type="text"][aria-label="Name color"]');
    await expect(nameColorInput).toHaveValue("#ffffff");
  });
});

// ─── Light/Dark Toggles ──────────────────────────────────────────────────────

test.describe("Theme Studio — Light/Dark Toggles", () => {
  test("disabling dark mode forces light theme on public page", async ({ proUser: page }) => {
    //* Arrange
    await resetCustomThemes(testUsers.pro.username);
    await setUserTier(testUsers.pro.username, "pro");
    await page.goto("/dashboard/theme");
    await page.getByRole("heading", { exact: true, name: t.theme }).waitFor();

    //* Act — disable dark mode
    const darkSwitch = page.getByText(t.enableDarkTheme).locator("..").getByRole("switch");
    await darkSwitch.click();
    await page.waitForTimeout(1_000);

    //* Assert — public page data-theme does not contain "dark"
    await page.goto(`/${testUsers.pro.username}`, { waitUntil: "domcontentloaded" });
    const pageRoot = page.locator(".lp-page-bg");
    const dataTheme = await pageRoot.getAttribute("data-theme");
    expect(dataTheme).not.toMatch(/dark/);

    //* Cleanup — re-enable dark mode
    await page.goto("/dashboard/theme");
    await page.getByRole("heading", { exact: true, name: t.theme }).waitFor();
    await page.getByText(t.enableDarkTheme).locator("..").getByRole("switch").click();
    await page.waitForTimeout(1_000);
  });

  test("cannot disable both light and dark mode", async ({ proUser: page }) => {
    //* Arrange
    await resetCustomThemes(testUsers.pro.username);
    await setUserTier(testUsers.pro.username, "pro");
    await page.goto("/dashboard/theme");
    await page.getByRole("heading", { exact: true, name: t.theme }).waitFor();

    //* Act — disable light, then attempt to disable dark
    const lightSwitch = page.getByText(t.enableLightTheme).locator("..").getByRole("switch");
    const darkSwitch = page.getByText(t.enableDarkTheme).locator("..").getByRole("switch");
    await lightSwitch.click();
    await page.waitForTimeout(1_000);
    await darkSwitch.click();

    //* Assert
    await expect(page.getByText(t.atLeastOneThemeMustBeEnabled)).toBeVisible();

    //* Cleanup — re-enable light mode
    await lightSwitch.click();
    await page.waitForTimeout(1_000);
  });
});

// ─── Raw CSS ─────────────────────────────────────────────────────────────────

test.describe("Theme Studio — Raw CSS", () => {
  test("raw CSS renders on public page via style tag", async ({ proUser: page }) => {
    //* Arrange — insert a theme with raw CSS via DB and assign to both slots
    await resetCustomThemes(testUsers.pro.username);
    await setUserTier(testUsers.pro.username, "pro");
    const rawCss = ".lp-page-bg .card { border-width: 2px; }";
    const themeId = await insertCustomTheme(testUsers.pro.username, { rawCss });
    await assignThemeSlotsDirectly(testUsers.pro.username, themeId);

    //* Act — visit public page
    await page.goto(`/${testUsers.pro.username}`, { waitUntil: "domcontentloaded" });

    //* Assert — the raw CSS appears in a <style> tag on the page
    const html = await page.content();
    expect(html).toContain("border-width: 2px");
  });
});

// ─── Theme Deletion ──────────────────────────────────────────────────────────

test.describe("Theme Studio — Deletion", () => {
  test("deleting an active theme resets slot to default preset", async ({ proUser: page }) => {
    //* Arrange — insert a theme, assign to both slots
    await resetCustomThemes(testUsers.pro.username);
    await setUserTier(testUsers.pro.username, "pro");
    const themeId = await insertCustomTheme(testUsers.pro.username);
    await assignThemeSlotsDirectly(testUsers.pro.username, themeId);

    //* Act — navigate to theme overview and delete the theme
    await page.goto("/dashboard/theme");
    await page.getByRole("heading", { exact: true, name: t.theme }).waitFor();
    await page.getByTitle(t.deleteTheme).first().click();

    //* Assert — deletion toast appears, public page falls back to a stock preset
    await expect(page.getByText(t.themeDeleted)).toBeVisible();
    await page.goto(`/${testUsers.pro.username}`, { waitUntil: "domcontentloaded" });
    const pageRoot = page.locator(".lp-page-bg");
    const dataTheme = await pageRoot.getAttribute("data-theme");
    expect(dataTheme).toMatch(/dark-depths|stateroom|obsidian|seafoam/);
  });
});

// ─── Downgrade Behavior ──────────────────────────────────────────────────────

test.describe("Theme Studio — Downgrade", () => {
  test("downgraded user's custom theme still renders on public page but studio locks Pro fields", async ({
    proUser: page,
  }) => {
    //* Arrange — insert a theme with a custom font as Pro, assign to both slots
    await resetCustomThemes(testUsers.pro.username);
    await setUserTier(testUsers.pro.username, "pro");
    const themeId = await insertCustomTheme(testUsers.pro.username, { font: "Roboto" });
    await assignThemeSlotsDirectly(testUsers.pro.username, themeId);

    //* Act — downgrade to free, then visit public page
    await setUserTier(testUsers.pro.username, "free");
    await page.goto(`/${testUsers.pro.username}`, { waitUntil: "domcontentloaded" });

    //* Assert — Google Font link is still rendered, studio locks Pro inputs
    const hasGoogleFontLink = await page.locator('link[href*="fonts.googleapis.com/css2?family=Roboto"]').count();
    expect(hasGoogleFontLink).toBeGreaterThan(0);
    await page.goto(`/dashboard/theme/studio/${themeId}`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByPlaceholder("Inter")).toBeDisabled();

    //* Cleanup — restore Pro tier
    await setUserTier(testUsers.pro.username, "pro");
  });
});

// ─── Exit Guard ──────────────────────────────────────────────────────────────

test.describe("Theme Studio — Exit Guard", () => {
  test("prompts on unsaved changes", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/theme/studio/new");
    await page.waitForLoadState("domcontentloaded");
    let dialogFired = false;
    page.on("dialog", async (dialog) => {
      dialogFired = true;
      await dialog.accept();
    });

    //* Act — make a change to mark the form dirty, then navigate away
    await page.getByPlaceholder(t.customTheme).fill("My Test Theme");
    await page.goto("/dashboard/theme").catch(() => {
      // beforeunload may cause ERR_ABORTED even after accepting; that's fine
    });

    //* Assert
    expect(dialogFired).toBe(true);
  });
});
