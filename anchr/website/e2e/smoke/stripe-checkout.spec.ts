import { expect, signInByUsername, test } from "../fixtures/auth";
import { getUserBilling } from "../fixtures/db";
import { t } from "../fixtures/i18n";
import { fillStripeTestCard } from "../fixtures/stripe-test-card";
import { createTransientUser, destroyTransientUser, type TransientUser } from "../fixtures/transient-user";

/**
 * Post-deploy stage smoke for the full purchase flow.
 *
 * Drives a real free user all the way through Stripe's hosted checkout
 * using the standard 4242 test card, then verifies:
 *
 *   1. The browser lands back on /dashboard/settings?checkout=success.
 *   2. The CheckoutCelebration overlay renders (client state wired correctly).
 *   3. The stage DB tier flips to `pro` after Stripe's webhook round-trips
 *      (proves the webhook endpoint is reachable and validates signatures
 *      against the real stage secret).
 *
 * Every test creates a fresh transient Clerk + DB user scoped to the run,
 * then tears it all down in `finally` — including any Stripe customers
 * created for that email, looked up via the Stripe API rather than the DB
 * so cleanup works even when the webhook hasn't round-tripped yet.
 *
 * Required env (all provided by the deploy workflow via `vercel env pull`):
 *   - DATABASE_URL         → stage Neon branch
 *   - CLERK_SECRET_KEY     → stage Clerk instance
 *   - STRIPE_SECRET_KEY    → stage Stripe test-mode key (sk_test_*)
 *   - STRIPE_PRO_PRICE_ID  → the Pro test-mode price id
 *   - E2E_USER_PASSWORD    → password applied to the transient Clerk user
 *
 * If any of these are missing the whole suite is skipped rather than
 * red-flagging the run — this keeps the test honest about its dependencies.
 */

const REQUIRED_ENV = [
  "CLERK_SECRET_KEY",
  "DATABASE_URL",
  "E2E_USER_PASSWORD",
  "STRIPE_PRO_PRICE_ID",
  "STRIPE_SECRET_KEY",
] as const;

function missingEnv(): string[] {
  return REQUIRED_ENV.filter((key) => process.env[key] == null || process.env[key] === "");
}

test.describe("stripe checkout — hosted flow smoke against stage", () => {
  test.skip(missingEnv().length > 0, `missing env: ${missingEnv().join(", ")}`);

  test("transient free user upgrades to pro via real Stripe checkout", async ({ page }) => {
    //* Arrange — create a run-scoped user we will fully tear down in finally
    let user: null | TransientUser = null;
    try {
      user = await createTransientUser();

      //* Act — run the full purchase flow from dashboard → Stripe → redirect
      await signInByUsername(page, user.username);
      await page.goto("/dashboard/settings");
      await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();
      // Scope to the main content area so the sidebar upgrade card (also
      // labelled "Upgrade to Pro") can't be clicked instead.
      const main = page.getByRole("main");
      await main.getByRole("button", { name: t.upgradeToPro }).click();
      await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 });
      await fillStripeTestCard(page, { email: user.email, name: "Smoke Test" });
      await page.waitForURL(/\/dashboard\/settings\?checkout=success/, { timeout: 60_000 });

      //* Assert — celebration renders AND the webhook upgraded the stage DB.
      // Polling on tier because Stripe's webhook delivery is async; typical
      // latency is < 5s in test mode, we give it a comfortable 30s window.
      const celebration = page.getByRole("dialog", { name: t.youreAnchored });
      await expect(celebration).toBeVisible({ timeout: 10_000 });
      await expect
        .poll(async () => (user != null ? (await getUserBilling(user.username))?.tier : null), {
          intervals: [500, 1000, 2000, 3000],
          timeout: 30_000,
        })
        .toBe("pro");
      const billing = await getUserBilling(user.username);
      expect(billing?.stripeCustomerId).not.toBeNull();
      expect(billing?.stripeSubscriptionId).not.toBeNull();
    } finally {
      if (user != null) {
        await destroyTransientUser(user);
      }
    }
  });
});
