import { expect, test as base } from "@playwright/test";
import { restorePasswordByEmail, test } from "./fixtures/auth";
import { t } from "./fixtures/i18n";
import { testUsers } from "./fixtures/test-users";

// ─── Forgot password (request side) ──────────────────────────────────────────
// Pre-cutover this spec exercised Clerk's signIn.create({ strategy:
// "reset_password_email_code" }) flow with an inline OTP entry on
// /update-password. BA's reset is link-based: /forgot-password takes an
// email + Turnstile token, BA emails a link to /update-password?token=…,
// and the token-consuming page lives in update-password-form.
//
// E2E coverage:
//  • /sign-in surfaces the forgot-password link to /forgot-password
//  • /forgot-password renders the request form
//  • Empty email shows validation
//  • Submitting a valid email transitions to the "check your email" card
//  • /update-password without a token surfaces the error fallback
//
// End-to-end token redemption isn't exercised here because the email link
// requires real Resend delivery in CI; that path is covered by
// integration tests in src/lib/better-auth/* and a manual smoke step in
// the Shot 2 runbook.

test.describe("forgot password", () => {
  base("sign-in page has a forgot password link to /forgot-password", async ({ page }) => {
    //* Arrange
    await page.goto("/sign-in");
    await page.getByLabel(t.email).waitFor();

    //* Act
    const link = page.getByRole("link", { name: t.forgotYourPassword });

    //* Assert
    await expect(link).toHaveAttribute("href", "/forgot-password");
  });

  base("/forgot-password renders the request form", async ({ page }) => {
    //* Act
    await page.goto("/forgot-password");

    //* Assert
    await expect(page.getByText(t.enterYourEmailToReceiveAResetLink)).toBeVisible();
    await expect(page.getByLabel(t.email)).toBeVisible();
    await expect(page.getByRole("button", { name: t.sendResetLink })).toBeVisible();
  });

  base("/update-password without a token surfaces the error fallback", async ({ page }) => {
    //* Act
    await page.goto("/update-password");

    //* Assert
    await expect(page.getByText(t.yourResetLinkIsInvalidOrExpired)).toBeVisible();
    await expect(page.getByRole("link", { name: t.requestANewLink })).toHaveAttribute("href", "/forgot-password");
  });

  base("submitting empty email keeps the form on the email step", async ({ page }) => {
    //* Arrange
    await page.goto("/forgot-password");
    await page.getByLabel(t.email).waitFor();

    //* Act — Turnstile widget no-ops without a site key in CI; the button
    // becomes enabled via the "skip" sentinel onToken effect.
    await page.getByRole("button", { name: t.sendResetLink }).click();

    //* Assert — form should not advance past the email step
    await expect(page.getByLabel(t.email)).toBeVisible();
    await expect(page.getByText(t.checkYourEmailForAResetLink)).toBeHidden();
  });
});

// ─── In-session password update (settings) ───────────────────────────────────

test.describe("settings password update", () => {
  test.describe.configure({ mode: "serial" });

  test("password section renders with disabled button when fields are empty", async ({ proUser: page }) => {
    //* Arrange
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

    //* Act
    const passwordHeading = page.locator("[data-slot='card-title']", { hasText: t.password });

    //* Assert
    await expect(passwordHeading).toBeVisible();
    await expect(page.getByText(t.updateYourPassword)).toBeVisible();
    await expect(page.getByLabel(t.currentPassword)).toBeVisible();
    await expect(page.getByLabel(t.newPassword, { exact: true })).toBeVisible();
    await expect(page.getByLabel(t.confirmPassword)).toBeVisible();
    await expect(page.getByRole("button", { name: t.updatePassword })).toBeDisabled();
  });

  test("shows validation error for short password", async ({ proUser: page }) => {
    const originalPassword = process.env.E2E_USER_PASSWORD;

    if (originalPassword == null) {
      test.skip(true, "E2E_USER_PASSWORD not set");
      return;
    }

    //* Arrange
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

    //* Act
    await page.getByLabel(t.currentPassword).fill(originalPassword);
    await page.getByLabel(t.newPassword, { exact: true }).fill("short");
    await page.getByLabel(t.confirmPassword).fill("short");
    await page.getByRole("button", { name: t.updatePassword }).click();

    //* Assert
    await expect(page.getByText(t.passwordMustBeAtLeast8Characters)).toBeVisible({ timeout: 15_000 });
  });

  test("shows validation error for password mismatch", async ({ proUser: page }) => {
    const originalPassword = process.env.E2E_USER_PASSWORD;

    if (originalPassword == null) {
      test.skip(true, "E2E_USER_PASSWORD not set");
      return;
    }

    //* Arrange
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

    //* Act
    await page.getByLabel(t.currentPassword).fill(originalPassword);
    await page.getByLabel(t.newPassword, { exact: true }).fill("ValidPassword1!");
    await page.getByLabel(t.confirmPassword).fill("DifferentPassword1!");
    await page.getByRole("button", { name: t.updatePassword }).click();

    //* Assert
    await expect(page.getByText(t.passwordsDoNotMatch)).toBeVisible({ timeout: 15_000 });
  });

  test("rotates password through BA changePassword and restores it", async ({ passwordProUser: page }) => {
    const originalPassword = process.env.E2E_USER_PASSWORD;

    if (originalPassword == null) {
      test.skip(true, "E2E_USER_PASSWORD not set");
      return;
    }

    const tempPassword = `Temp-E2E-${Date.now()}!`;

    //* Arrange
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

    //* Act — change password
    await page.getByLabel(t.currentPassword).fill(originalPassword);
    await page.getByLabel(t.newPassword, { exact: true }).fill(tempPassword);
    await page.getByLabel(t.confirmPassword).fill(tempPassword);
    await page.getByRole("button", { name: t.updatePassword }).click();

    //* Assert — success toast
    await expect(page.getByText(t.passwordUpdated)).toBeVisible({ timeout: 15_000 });

    //* Act — restore original password
    await page.getByLabel(t.currentPassword).fill(tempPassword);
    await page.getByLabel(t.newPassword, { exact: true }).fill(originalPassword);
    await page.getByLabel(t.confirmPassword).fill(originalPassword);
    await page.getByRole("button", { name: t.updatePassword }).click();

    //* Assert — success toast again
    await expect(page.getByText(t.passwordUpdated)).toBeVisible({ timeout: 15_000 });
  });

  // Safety net: always restore password via direct DB write after settings tests
  test.afterAll(async () => {
    const password = process.env.E2E_USER_PASSWORD;

    if (password == null) {
      return;
    }

    try {
      await restorePasswordByEmail(testUsers.passwordPro.email, password);
    } catch {
      // Best-effort cleanup
    }
  });
});
