import { expect, test } from "./fixtures/auth";
import { setUserTier } from "./fixtures/db";
import { t } from "./fixtures/i18n";
import { testUsers } from "./fixtures/test-users";

test.describe("Theme Studio", () => {
  test.describe.configure({ mode: "serial" });

  // ─── Free User ──────────────────────────────────────────────────────────────

  test("free user can create a theme with color pickers, Pro features are disabled", async ({ freeUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/theme");
    await page.getByRole("heading", { name: t.theme }).waitFor();

    //* Act — navigate to studio, save a theme
    await page.getByRole("link", { name: t.createTheme }).click();
    await page.waitForURL("**/theme/studio/new**");
    await page.getByRole("button", { name: t.saveTheme }).click();

    //* Assert — color sections visible, Pro inputs disabled, theme saved
    await expect(page.getByText("Page").first()).toBeVisible();
    await expect(page.getByText("Avatar").first()).toBeVisible();
    await expect(page.getByPlaceholder("Inter")).toBeDisabled();
    await expect(page.getByText(t.themeCreated)).toBeVisible();
  });

  test("free user cannot create more than 2 themes", async ({ freeUser: page }) => {
    //* Arrange — create second theme (first was created in the test above, serial mode)
    await page.goto("/dashboard/theme/studio/new");
    await page.waitForLoadState("domcontentloaded");
    await page.getByRole("button", { name: t.saveTheme }).click();
    await page.getByText(t.themeCreated).waitFor();

    //* Act — attempt to create a third theme (should exceed the 2-theme free limit)
    await page.goto("/dashboard/theme/studio/new");
    await page.waitForLoadState("domcontentloaded");
    await page.getByRole("button", { name: t.saveTheme }).click();

    //* Assert — limit reached error
    await expect(page.getByText(t.themeLimitReached)).toBeVisible();
  });

  // ─── Pro User ───────────────────────────────────────────────────────────────

  test("pro user creates a theme with a custom color, applies it, and the color renders on the public page", async ({
    proUser: page,
  }) => {
    //* Arrange
    await page.goto("/dashboard/theme");
    await page.getByRole("heading", { name: t.theme }).waitFor();
    await page.getByRole("link", { name: t.createTheme }).click();
    await page.waitForURL("**/theme/studio/new**");

    //* Act — set display name color to distinctive red, apply to dark slot
    const nameColorInput = page.getByRole("textbox", { name: "Name color" });
    await nameColorInput.clear();
    await nameColorInput.fill("#ff0000");
    await page.getByRole("button", { name: t.applyToDarkSlot }).click();

    //* Assert — theme saved, redirected to edit page, color renders on public page
    await expect(page.getByText(t.themeSaved)).toBeVisible();
    await expect(page).toHaveURL(/\/theme\/studio\/[a-f0-9-]+/);
    await page.goto(`/${testUsers.pro.username}`);
    await page.waitForLoadState("domcontentloaded");
    const pageRoot = page.locator("[data-theme]").first();
    const dataTheme = await pageRoot.getAttribute("data-theme");
    expect(dataTheme).toMatch(/custom-dark|custom-light/);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- evaluate runs in browser context; e2e tsconfig lacks DOM types
    const nameColor = await pageRoot.evaluate((el: any) => el.style.getPropertyValue("--anc-theme-name-color").trim());
    expect(nameColor).toBe("#ff0000");
  });

  test("pro user has full editor access: font, border radius, raw CSS", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/theme/studio/new");
    await page.waitForLoadState("domcontentloaded");

    //* Act — check Pro controls
    const isFontDisabled = await page.getByPlaceholder("Inter").isDisabled();
    const isSliderDisabled = await page.locator('input[type="range"]').isDisabled();

    //* Assert — Pro inputs are enabled, raw CSS toggle is available
    expect(isFontDisabled).toBe(false);
    expect(isSliderDisabled).toBe(false);
    await expect(page.getByRole("button", { name: t.showEditor })).toBeVisible();
  });

  // ─── Light/Dark Toggles ─────────────────────────────────────────────────────

  test("disabling dark mode hides dark picker and forces light on public page", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/theme");
    await page.getByRole("heading", { name: t.theme }).waitFor();
    const darkSwitch = page.getByText(t.enableDarkTheme).locator("..").getByRole("switch");

    //* Act — disable dark mode
    await darkSwitch.click();
    await page.waitForTimeout(1000);

    //* Assert — dark theme picker hidden, public page forces non-dark theme
    await expect(page.getByText(t.darkTheme)).toBeHidden();
    await page.goto(`/${testUsers.pro.username}`);
    await page.waitForLoadState("domcontentloaded");
    const pageRoot = page.locator("[data-theme]").first();
    const dataTheme = await pageRoot.getAttribute("data-theme");
    expect(dataTheme).not.toMatch(/dark/);

    //* Arrange — re-enable dark mode for subsequent tests
    await page.goto("/dashboard/theme");
    await page.getByRole("heading", { name: t.theme }).waitFor();
    await darkSwitch.click();
    await page.waitForTimeout(1000);
  });

  test("cannot disable both light and dark mode", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/theme");
    await page.getByRole("heading", { name: t.theme }).waitFor();
    const lightSwitch = page.getByText(t.enableLightTheme).locator("..").getByRole("switch");
    const darkSwitch = page.getByText(t.enableDarkTheme).locator("..").getByRole("switch");

    //* Act — disable light mode, then attempt to disable dark mode too
    await lightSwitch.click();
    await page.waitForTimeout(1000);
    await darkSwitch.click();

    //* Assert — error toast shown
    await expect(page.getByText(t.atLeastOneThemeMustBeEnabled)).toBeVisible();

    //* Arrange — re-enable light mode for subsequent tests
    await lightSwitch.click();
    await page.waitForTimeout(1000);
  });

  // ─── Raw CSS ────────────────────────────────────────────────────────────────

  test("raw CSS persists after save and reload", async ({ proUser: page }) => {
    //* Arrange — create a new theme and open the raw CSS editor
    await page.goto("/dashboard/theme/studio/new");
    await page.waitForLoadState("domcontentloaded");
    await page.getByRole("button", { name: t.showEditor }).click();
    const monacoEditor = page.locator(".monaco-editor").first();
    await monacoEditor.waitFor();

    //* Act — type valid CSS into Monaco, save the theme
    await monacoEditor.click();
    await page.keyboard.type(".lp-page-bg .card { border-width: 2px; }");
    await page.getByRole("button", { name: t.saveTheme }).click();
    await page.getByText(t.themeCreated).waitFor();
    const editUrl = page.url();

    //* Assert — reload the edit page, open editor, verify CSS persisted
    await page.goto(editUrl);
    await page.waitForLoadState("domcontentloaded");
    await page.getByRole("button", { name: t.showEditor }).click();
    await page.locator(".monaco-editor").first().waitFor();
    const editorText = await page.locator(".monaco-editor .view-lines").textContent();
    expect(editorText).toContain("border-width");
  });

  test("blacklisted CSS is stripped on save", async ({ proUser: page }) => {
    //* Arrange — create a new theme and open the raw CSS editor
    await page.goto("/dashboard/theme/studio/new");
    await page.waitForLoadState("domcontentloaded");
    await page.getByRole("button", { name: t.showEditor }).click();
    const monacoEditor = page.locator(".monaco-editor").first();
    await monacoEditor.waitFor();

    //* Act — type blacklisted CSS (position: fixed), save
    await monacoEditor.click();
    await page.keyboard.type(".lp-page-bg { position: fixed; color: green; }");
    await page.getByRole("button", { name: t.saveTheme }).click();
    await page.getByText(t.themeCreated).waitFor();
    const editUrl = page.url();

    //* Assert — reload, verify position:fixed was stripped but color:green survived
    await page.goto(editUrl);
    await page.waitForLoadState("domcontentloaded");
    await page.getByRole("button", { name: t.showEditor }).click();
    await page.locator(".monaco-editor").first().waitFor();
    const editorText = await page.locator(".monaco-editor .view-lines").textContent();
    expect(editorText).toContain("color");
    expect(editorText).not.toContain("position");
  });

  // ─── Customize (Copy) Flow ─────────────────────────────────────────────────

  test("creating a theme from a preset pre-populates variables", async ({ proUser: page }) => {
    //* Arrange — navigate to studio with ?from=dark-depths
    await page.goto("/dashboard/theme/studio/new?from=dark-depths");
    await page.waitForLoadState("domcontentloaded");

    //* Act — read the name color input value (should be dark-depths preset value)
    const nameColorInput = page.getByRole("textbox", { name: "Name color" });
    const value = await nameColorInput.inputValue();

    //* Assert — value matches dark-depths name-color (#ffffff)
    expect(value).toBe("#ffffff");
  });

  // ─── Downgrade Behavior ──────────────────────────────────────────────────────

  test("downgraded user's custom theme still renders on public page but studio locks Pro fields", async ({
    proUser: page,
  }) => {
    //* Arrange — create a theme with a custom font as pro, apply it, then downgrade to free
    await page.goto("/dashboard/theme/studio/new");
    await page.waitForLoadState("domcontentloaded");
    const fontInput = page.getByPlaceholder("Inter");
    await fontInput.fill("Roboto");
    await page.getByRole("button", { name: t.applyToDarkSlot }).click();
    await page.getByText(t.themeSaved).waitFor();
    const editUrl = page.url();
    await setUserTier(testUsers.pro.username, "free");

    //* Act — visit public page, then revisit the studio
    await page.goto(`/${testUsers.pro.username}`);
    await page.waitForLoadState("domcontentloaded");
    const hasGoogleFontLink = await page.locator('link[href*="fonts.googleapis.com/css2?family=Roboto"]').count();
    await page.goto(editUrl);
    await page.waitForLoadState("domcontentloaded");

    //* Assert — public page still loads the custom font, studio locks Pro inputs
    expect(hasGoogleFontLink).toBeGreaterThan(0);
    await expect(page.getByPlaceholder("Inter")).toBeDisabled();

    //* Arrange — restore pro tier for subsequent tests
    await setUserTier(testUsers.pro.username, "pro");
  });

  // ─── Theme Deletion ─────────────────────────────────────────────────────────

  test("deleting an active theme resets slot to default preset", async ({ proUser: page }) => {
    //* Arrange — navigate to theme page
    await page.goto("/dashboard/theme");
    await page.getByRole("heading", { name: t.theme }).waitFor();

    //* Act — delete the first custom theme
    await page.getByTitle(t.deleteTheme).first().click();

    //* Assert — deletion confirmed, public page falls back to a stock preset
    await expect(page.getByText(t.themeDeleted)).toBeVisible();
    await page.goto(`/${testUsers.pro.username}`);
    await page.waitForLoadState("domcontentloaded");
    const pageRoot = page.locator("[data-theme]").first();
    const dataTheme = await pageRoot.getAttribute("data-theme");
    expect(dataTheme).toMatch(/dark-depths|stateroom|obsidian|seafoam/);
  });

  // ─── Exit Guard ─────────────────────────────────────────────────────────────

  test("exit guard prompts on unsaved changes", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/theme/studio/new");
    await page.waitForLoadState("domcontentloaded");
    let dialogDismissed = false;
    page.on("dialog", async (dialog) => {
      dialogDismissed = true;
      await dialog.dismiss();
    });

    //* Act — make changes to mark form dirty, then try to navigate away
    await page.getByPlaceholder(t.customTheme).fill("My Test Theme");
    await page.goto("/dashboard/theme");

    //* Assert — beforeunload dialog was triggered
    expect(dialogDismissed).toBe(true);
  });
});
