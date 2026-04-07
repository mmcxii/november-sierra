import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test as base } from "@playwright/test";
import { restorePasswordByUsername, test } from "./fixtures/auth";
import { t } from "./fixtures/i18n";
import { testUsers } from "./fixtures/test-users";

/** Clerk test/dev instances always accept this OTP code. */
const TEST_OTP = "424242";

test.describe("forgot password", () => {
  base("sign-in page has forgot password link that navigates to /update-password", async ({ page }) => {
    //* Arrange
    await page.goto("/sign-in");
    await page.getByLabel(t.email).waitFor();

    //* Act
    await page.getByRole("link", { name: t.forgotYourPassword }).click();

    //* Assert
    await expect(page).toHaveURL(/\/update-password/);
    await expect(page.getByText(t.forgotYourPassword)).toBeVisible();
    await expect(page.getByLabel(t.email)).toBeVisible();
    await expect(page.getByRole("button", { name: t.sendResetCode })).toBeVisible();
  });

  base("forgot password page shows email step with back-to-sign-in link", async ({ page }) => {
    //* Act
    await page.goto("/update-password");

    //* Assert
    await expect(page.getByText(t.enterYourEmailAndWellSendYouACodeToResetYourPassword)).toBeVisible();
    await expect(page.getByRole("link", { name: t.signIn })).toHaveAttribute("href", "/sign-in");
  });

  base("submitting empty email shows validation error", async ({ page }) => {
    //* Arrange
    await page.goto("/update-password");
    await page.getByLabel(t.email).waitFor();

    //* Act
    await page.getByRole("button", { name: t.sendResetCode }).click();

    //* Assert — form should not advance to step 2
    await expect(page.getByLabel(t.email)).toBeVisible();
    await expect(page.locator("[data-slot='card-title']", { hasText: t.resetYourPassword })).toBeHidden();
  });

  base("full forgot password flow: email → code → new password → redirects to sign-in", async ({ page }) => {
    const originalPassword = process.env.E2E_USER_PASSWORD;

    if (originalPassword == null) {
      base.skip(true, "E2E_USER_PASSWORD not set");
      return;
    }

    //* Arrange — inject Clerk testing token so signIn.create works in test mode
    await setupClerkTestingToken({ context: page.context() });
    await page.goto("/update-password");
    await page.waitForFunction(() => window.Clerk?.loaded);
    await page.getByLabel(t.email).waitFor();

    //* Act — submit email to get reset code (uses +clerk_test email to bypass email limit)
    await page.getByLabel(t.email).fill(testUsers.passwordPro.email);
    await page.getByRole("button", { name: t.sendResetCode }).click();

    //* Assert — should advance to step 2
    await expect(page.locator("[data-slot='card-title']", { hasText: t.resetYourPassword })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(t.verificationCode)).toBeVisible();

    //* Act — enter OTP code and new password
    const otpContainer = page.locator("[data-input-otp]");
    await otpContainer.pressSequentially(TEST_OTP);

    await page.getByLabel(t.newPassword, { exact: true }).fill(originalPassword);
    await page.getByLabel(t.confirmPassword).fill(originalPassword);
    await page.getByRole("button", { name: t.updatePassword }).click();

    //* Assert — should redirect to sign-in
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
  });

  // Always restore the password via Clerk Backend API after forgot-password tests
  base.afterAll(async () => {
    const password = process.env.E2E_USER_PASSWORD;

    if (password == null) {
      return;
    }

    try {
      await restorePasswordByUsername(testUsers.passwordPro.username, password);
    } catch {
      // Best-effort cleanup
    }
  });
});

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

  test("updates password with correct current password and then restores it", async ({ passwordProUser: page }) => {
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

  test("wrong password shows email fallback, and email fallback completes password update", async ({
    passwordProUser: page,
  }) => {
    const originalPassword = process.env.E2E_USER_PASSWORD;

    if (originalPassword == null) {
      test.skip(true, "E2E_USER_PASSWORD not set");
      return;
    }

    //* Arrange
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

    //* Act — enter wrong current password
    await page.getByLabel(t.currentPassword).fill("wrong-password-123");
    await page.getByLabel(t.newPassword, { exact: true }).fill(originalPassword);
    await page.getByLabel(t.confirmPassword).fill(originalPassword);
    await page.getByRole("button", { name: t.updatePassword }).click();

    //* Assert — error with email fallback option
    await expect(page.getByText(t.incorrectPasswordYouCanVerifyViaEmailInstead)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: t.verifyViaEmail })).toBeVisible();

    //* Act — click email fallback, enter OTP
    await page.getByRole("button", { name: t.verifyViaEmail }).click();
    await page.getByText(t.enterTheCodeWeSentToYourEmail).waitFor();

    const otpContainer = page.locator("[data-input-otp]");
    await otpContainer.pressSequentially(TEST_OTP);

    // New password fields should be pre-filled from before; OTP auto-submits when all fields are valid

    //* Assert — success toast
    await expect(page.getByText(t.passwordUpdated)).toBeVisible({ timeout: 15_000 });
  });

  test("cancel button in email fallback returns to form step", async ({ passwordProUser: page }) => {
    const originalPassword = process.env.E2E_USER_PASSWORD;

    if (originalPassword == null) {
      test.skip(true, "E2E_USER_PASSWORD not set");
      return;
    }

    //* Arrange — trigger email fallback
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();
    await page.getByLabel(t.currentPassword).fill("wrong-password-123");
    await page.getByLabel(t.newPassword, { exact: true }).fill(originalPassword);
    await page.getByLabel(t.confirmPassword).fill(originalPassword);
    await page.getByRole("button", { name: t.updatePassword }).click();
    await page.getByRole("button", { name: t.verifyViaEmail }).waitFor({ timeout: 15_000 });
    await page.getByRole("button", { name: t.verifyViaEmail }).click();
    await page.getByText(t.enterTheCodeWeSentToYourEmail).waitFor();

    //* Act — click cancel
    await page.getByRole("button", { name: t.cancel }).click();

    //* Assert — back to form step
    await expect(page.getByLabel(t.currentPassword)).toBeVisible();
    await expect(page.getByText(t.enterTheCodeWeSentToYourEmail)).toBeHidden();
  });

  // Safety net: always restore password via Clerk Backend API after settings tests
  test.afterAll(async () => {
    const password = process.env.E2E_USER_PASSWORD;

    if (password == null) {
      return;
    }

    try {
      await restorePasswordByUsername(testUsers.passwordPro.username, password);
    } catch {
      // Best-effort cleanup
    }
  });
});
