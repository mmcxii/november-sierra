import { expect, test } from "./fixtures/auth";
import { getUserBilling, setUserBilling, setUserTier } from "./fixtures/db";
import { t } from "./fixtures/i18n";
import { testUsers } from "./fixtures/test-users";

/**
 * End-to-end coverage for the upgrade/downgrade flows re-enabled in ANC-107.
 *
 * We can't drive Stripe's hosted checkout or customer portal from Playwright,
 * so the assertions here split into two groups:
 *
 * 1. **UI reacts to DB state** — flip `tier` in the database and verify that
 *    the settings card, sidebar upgrade card, and marketing pricing cards
 *    all render the correct variant. Tests are paired with a restore step
 *    so subsequent tests see the seeded state they expect.
 *
 * 2. **Server-action trigger** — click the Manage Billing button and confirm
 *    the action pipeline reaches `createPortalSession` (which short-circuits
 *    because the test user has no stripeCustomerId).
 *
 * Webhook + action logic itself is unit-tested in
 * `src/app/api/stripe/webhook/route.test.ts` and
 * `src/app/(dashboard)/dashboard/settings/billing-actions.test.ts`. Combined,
 * unit tests prove the server-side behavior and these e2e tests prove the
 * UI wiring is correct end-to-end against a real browser + dev server.
 */

test.describe("billing — upgrade & downgrade", () => {
  test("checkout success query param triggers the CheckoutCelebration overlay", async ({ proUser: page }) => {
    //* Act — navigate to settings with the success query param Stripe redirects to
    await page.goto("/dashboard/settings?checkout=success");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

    //* Assert — celebration dialog visible with welcome copy and a Continue button
    const dialog = page.getByRole("dialog", { name: t.youreAnchored });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(t.welcomeAboardProYoureReadyToChartYourOwnCourse)).toBeVisible();
    await expect(dialog.getByRole("button", { name: t.continue })).toBeVisible();

    //* Act — dismiss
    await dialog.getByRole("button", { name: t.continue }).click();

    //* Assert — dialog closes
    await expect(dialog).not.toBeVisible();
  });

  test("simulated upgrade: flipping tier to pro hides sidebar CTA and shows manage billing", async ({
    freeUser: page,
  }) => {
    try {
      //* Act — flip tier in the DB (simulates a successful webhook upgrade) and reload
      await setUserTier(testUsers.admin.username, "pro");
      await page.reload();
      await page.getByRole("heading", { exact: true, name: t.links }).waitFor();

      //* Assert — sidebar card is gone and the pro badge appears
      const sidebar = page.locator("aside").first();
      await expect(sidebar.getByText(t.unlockMoreWithPro)).toBeHidden();
      await expect(sidebar.getByText(t.pro, { exact: true })).toBeVisible();

      //* Act — navigate to settings
      await page.goto("/dashboard/settings");
      await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

      //* Assert — Current Plan card now offers Manage billing, not Upgrade
      const main = page.getByRole("main");
      await expect(main.getByRole("button", { name: t.manageBilling })).toBeVisible();
      await expect(main.getByRole("button", { name: t.upgradeToPro })).toHaveCount(0);

      //* Act — navigate to the marketing pricing page
      await page.goto("/pricing");
      await page.getByText(t.$7Mo).waitFor();

      //* Assert — no upgrade CTAs for pro users
      await expect(page.getByRole("link", { name: t.upgradeToPro })).toHaveCount(0);
      await expect(page.getByRole("button", { name: t.upgradeToPro })).toHaveCount(0);
    } finally {
      // Restore shared admin user to free so other tests aren't disturbed.
      await setUserTier(testUsers.admin.username, "free");
    }
  });

  test("simulated downgrade: flipping tier to free restores sidebar CTA and upgrade button", async ({
    proUser: page,
  }) => {
    try {
      //* Act — flip tier in the DB (simulates customer.subscription.deleted) and reload
      await setUserTier(testUsers.pro.username, "free");
      await page.reload();
      await page.getByRole("heading", { exact: true, name: t.links }).waitFor();

      //* Assert — sidebar card is back
      const sidebar = page.locator("aside").first();
      await expect(sidebar.getByText(t.unlockMoreWithPro)).toBeVisible();
      await expect(sidebar.getByRole("button", { name: t.upgradeToPro })).toBeEnabled();

      //* Act — navigate to settings
      await page.goto("/dashboard/settings");
      await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

      //* Assert — Current Plan card now offers Upgrade, not Manage billing
      const main = page.getByRole("main");
      await expect(main.getByRole("button", { name: t.upgradeToPro })).toBeEnabled();
      await expect(main.getByRole("button", { name: t.manageBilling })).toHaveCount(0);

      //* Act — navigate to the marketing pricing page
      await page.goto("/pricing");
      await page.getByText(t.$7Mo).waitFor();

      //* Assert — signed-in free user sees the in-card upgrade button (not a link) on the Pro card
      await expect(page.getByRole("button", { name: t.upgradeToPro })).toHaveCount(1);
    } finally {
      // Restore pro user tier so other tests see the seeded state.
      await setUserTier(testUsers.pro.username, "pro");
    }
  });

  test("referral pro is preserved in DB state when seeded with expiry date + stripe ids", async ({
    freeUser: page,
  }) => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    try {
      //* Act — seed the admin user as pro with a stripe subscription AND referral pro remaining
      await setUserBilling(testUsers.admin.username, {
        proExpiresAt: future,
        stripeCustomerId: "cus_e2e_referral",
        stripeSubscriptionId: "sub_e2e_referral",
        tier: "pro",
      });
      await page.reload();
      await page.getByRole("heading", { exact: true, name: t.links }).waitFor();
      const billing = await getUserBilling(testUsers.admin.username);

      //* Assert — sidebar renders pro state and DB state round-trips exactly
      const sidebar = page.locator("aside").first();
      await expect(sidebar.getByText(t.pro, { exact: true })).toBeVisible();
      await expect(sidebar.getByText(t.unlockMoreWithPro)).toBeHidden();
      expect(billing?.tier).toBe("pro");
      expect(billing?.stripeCustomerId).toBe("cus_e2e_referral");
      expect(billing?.stripeSubscriptionId).toBe("sub_e2e_referral");
      expect(billing?.proExpiresAt?.getTime()).toBe(future.getTime());
    } finally {
      // Reset admin user to a clean free state (no stripe ids, no expiry).
      await setUserBilling(testUsers.admin.username, {
        proExpiresAt: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        tier: "free",
      });
    }
  });

  test("clicking manage billing for a pro user without a stripe customer shows an error toast", async ({
    proUser: page,
  }) => {
    // The seeded pro user has no stripeCustomerId (we never ran checkout in
    // test mode), so `createPortalSession` should short-circuit and return
    // an error. This proves the action path is wired correctly without
    // requiring a real Stripe customer.

    //* Act
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();
    const main = page.getByRole("main");
    await main.getByRole("button", { name: t.manageBilling }).click();

    //* Assert — error toast surfaces the i18n key
    await expect(page.getByText(t.somethingWentWrongPleaseTryAgain)).toBeVisible();
  });
});
