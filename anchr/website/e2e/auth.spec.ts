import { expect, test as base } from "@playwright/test";
import { test } from "./fixtures/auth";
import { t } from "./fixtures/i18n";

test.describe("route protection", () => {
  base("redirects unauthenticated users away from /dashboard", async ({ page }) => {
    //* Act
    await page.goto("/dashboard");

    //* Assert
    await expect(page).toHaveURL(/redirect_url/);
  });

  base("sign-in page renders functional form with sign-up link", async ({ page }) => {
    //* Act
    await page.goto("/sign-in");

    //* Assert
    await expect(page.getByLabel(t.email)).toBeVisible();
    await expect(page.getByLabel(t.password)).toBeVisible();
    await expect(page.getByRole("button", { name: t.continue })).toBeVisible();
    await expect(page.getByRole("link", { name: t.signUp })).toHaveAttribute("href", "/sign-up");
  });

  test("redirects authenticated users from /sign-in to /dashboard", async ({ proUser: page }) => {
    //* Act
    await page.goto("/sign-in");

    //* Assert
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

// ─── Sign-up referral code UI ─────────────────────────────────────────────────
// These tests verify the referral code input on the sign-up form itself. They do
// not go through Clerk's sign-up flow — they only test our UI code (the toggle,
// the ?ref= pre-fill, and the input rendering).

test.describe("sign-up referral code UI", () => {
  base("shows referral code input when toggled", async ({ page }) => {
    //* Arrange
    await page.goto("/sign-up");
    await page.getByText(t.createAnAccount).waitFor();

    //* Act
    await page.getByRole("button", { name: t.haveAReferralCode }).click();

    //* Assert
    await expect(page.locator("#referral-code")).toBeVisible();
  });

  base("hides referral code input by default", async ({ page }) => {
    //* Act
    await page.goto("/sign-up");
    await page.getByText(t.createAnAccount).waitFor();

    //* Assert
    await expect(page.getByRole("button", { name: t.haveAReferralCode })).toBeVisible();
    await expect(page.locator("#referral-code")).toBeHidden();
  });

  base("pre-fills referral code from ?ref= query param", async ({ page }) => {
    //* Act
    await page.goto("/sign-up?ref=ANCHR-TEST01");
    await page.getByText(t.createAnAccount).waitFor();

    //* Assert
    await expect(page.locator("#referral-code")).toBeVisible();
    await expect(page.locator("#referral-code")).toHaveValue("ANCHR-TEST01");
  });
});
