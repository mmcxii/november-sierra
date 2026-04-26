import { expect, test as base } from "@playwright/test";
import { test } from "./fixtures/auth";
import { t } from "./fixtures/i18n";

test.describe("route protection", () => {
  base("redirects unauthenticated users away from /dashboard to /sign-in", async ({ page }) => {
    //* Act
    await page.goto("/dashboard");

    //* Assert
    await expect(page).toHaveURL(/\/sign-in/);
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

// ─── Sign-out ────────────────────────────────────────────────────────────────
// BA's sign-out endpoint requires:
//  • An Origin header (BA's origin check rejects mutating POSTs without one)
//  • A valid JSON body (BA's JSON.parse fails on an empty body)
//
// We assert on cookie removal directly rather than the post-sign-out redirect
// target — the redirect itself is exercised in middleware-level integration
// tests, while the cookie clear is the load-bearing user-visible signal.

test.describe("sign-out", () => {
  test("hits BA sign-out and clears the session cookie", async ({ baseURL, proUser: page }) => {
    //* Arrange
    if (baseURL == null) {
      throw new Error("baseURL is required");
    }
    await page.goto("/dashboard");
    const cookiesBefore = await page.context().cookies();
    const baCookieBefore = cookiesBefore.find((c) => c.name.includes("better-auth.session"));

    //* Act
    const signOut = await page.request.post(`${baseURL}/api/v1/auth/sign-out`, {
      data: {},
      headers: { "content-type": "application/json", origin: new URL(baseURL).origin },
    });
    const cookiesAfter = await page.context().cookies();
    const baCookieAfter = cookiesAfter.find((c) => c.name.includes("better-auth.session"));

    //* Assert
    expect(signOut.ok()).toBe(true);
    expect(baCookieBefore).toBeDefined();
    expect(baCookieAfter).toBeUndefined();
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
