import { expect, test } from "./fixtures/auth";
import { t } from "./fixtures/i18n";
import { E2E_REFERRAL_CODE } from "./fixtures/test-users";

test.describe("onboarding flow", () => {
  test.describe.configure({ mode: "serial" });

  test("redirects non-onboarded user to /onboarding", async ({ freshUser: page }) => {
    //* Act
    await page.goto("/dashboard");

    //* Assert
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test("username step validates availability and advances to link step", async ({ freshUser: page }) => {
    //* Arrange
    await page.goto("/onboarding");
    await page.getByText(t.chooseYourUsername).waitFor();

    //* Act
    const usernameInput = page.getByPlaceholder("your_username");
    await usernameInput.clear();
    const uniqueUsername = `e2eob${Date.now()}`;
    await usernameInput.fill(uniqueUsername);
    await page.getByText(t.usernameIsAvailable).waitFor();
    await page.getByRole("button", { name: t.continue }).click();

    //* Assert
    await expect(page.getByText(t.addYourFirstLink)).toBeVisible();
  });

  test("link step accepts first link and advances to theme step", async ({ freshUser: page }) => {
    //* Arrange
    await page.goto("/onboarding?step=link");
    await page.getByText(t.addYourFirstLink).waitFor();

    //* Act
    await page.getByPlaceholder("My Website").fill("My First Link");
    await page.locator("#linkUrl").fill("https://example.com");
    await page.getByRole("button", { name: t.continue }).click();

    //* Assert
    await expect(page.getByText(t.pickATheme)).toBeVisible();
  });

  // ─── Referral code redemption ──────────────────────────────────────────────
  //
  // WHY WE SET LOCALSTORAGE INSTEAD OF SIGNING UP:
  //
  // Clerk's sign-up flow in CI gets stuck on the session handshake redirect.
  // After OTP verification succeeds, Clerk navigates to a base64 token URL
  // (the "__clerk_handshake") which should redirect to /onboarding, but this
  // redirect never completes in headless Chromium on GitHub Actions. This is a
  // Clerk infrastructure issue outside our control — the sign-up, OTP
  // verification, and session creation all succeed, but the final handshake
  // redirect hangs indefinitely.
  //
  // WHAT WE MOCK:
  //
  // Only the localStorage write that the sign-up form's onSignUp handler
  // performs when a user enters a referral code. Instead of creating a new
  // Clerk user via sign-up, we use the pre-seeded freshUser fixture (a real
  // Clerk user signed in via the backend API) and set the anchr_referral_code
  // localStorage key directly — the same key and format the sign-up form uses.
  //
  // WHAT IS NOT MOCKED:
  //
  // Everything after sign-up is real:
  // - The theme step reading the referral code from localStorage
  // - The completeOnboarding() server action calling redeemReferralCode()
  // - The referral code validation, redemption tracking, and Pro grant in the DB
  // - The settings page reflecting the Pro status after redemption
  //
  // The sign-up form UI (referral code input, toggle, ?ref= pre-fill) is
  // tested separately in e2e/auth.spec.ts.
  test("theme step redeems referral code, completes onboarding, and grants Pro", async ({ freshUser: page }) => {
    await page.goto("/onboarding?step=theme");
    await page.getByText(t.pickATheme).waitFor();
    await page.evaluate((code) => localStorage.setItem("anchr_referral_code", code), E2E_REFERRAL_CODE);

    //* Act
    await page.getByRole("button", { name: t.continue }).click();
    await page.waitForURL(/\/(onboarding|dashboard)/);
    const goToDashboard = page.getByRole("link", { name: t.goToDashboard });
    if (await goToDashboard.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await goToDashboard.click();
    }
    await page.waitForURL(/\/dashboard/);
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { name: t.settings }).waitFor();

    //* Assert — referral code was redeemed and Pro access was granted
    await expect(page.getByRole("button", { name: t.manageBilling })).toBeVisible();
  });
});
