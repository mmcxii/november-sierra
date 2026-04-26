import { expect, signInUser, test } from "../fixtures/auth";
import { getUserBilling, getUserIdByUsername } from "../fixtures/db";
import { t } from "../fixtures/i18n";
import { buildCheckoutCompletedPayload, signStripePayload } from "../fixtures/stripe-webhook";
import { createTransientUser, destroyTransientUser, type TransientUser } from "../fixtures/transient-user";

/**
 * Post-deploy stage smoke for the upgrade-to-pro flow.
 *
 * Stripe's own automated-testing docs explicitly recommend against driving
 * their hosted checkout UI (checkout.stripe.com). The DOM has no stable
 * selectors, and Stripe may block or CAPTCHA automated browsers. Instead
 * we verify OUR integration points:
 *
 *   1. Click "Upgrade to Pro" → browser reaches checkout.stripe.com.
 *      Proves createCheckoutSession creates a real session with the correct
 *      price id and Stripe accepts it.
 *
 *   2. POST a synthetic `checkout.session.completed` event signed with
 *      stage's STRIPE_WEBHOOK_SECRET directly to the live webhook
 *      endpoint. Proves the route is reachable, signature verification
 *      passes against the real secret, and the handler upgrades the user.
 *
 *   3. Poll the DB for tier=pro. Proves the write landed.
 *
 * Together these cover the full pipeline end-to-end without touching
 * Stripe's intentionally-unstable hosted DOM.
 *
 * Required env (all provided by the deploy workflow via `vercel env pull`):
 *   - DATABASE_URL                 → stage Neon branch
 *   - STRIPE_SECRET_KEY            → for transient-user cleanup
 *   - STRIPE_WEBHOOK_SECRET        → for signing synthetic webhook events
 *   - STRIPE_PRO_PRICE_ID_MONTHLY  → proves checkout creates a real session
 *   - E2E_USER_PASSWORD            → password for the transient BA user
 */

const REQUIRED_ENV = [
  "DATABASE_URL",
  "E2E_USER_PASSWORD",
  "STRIPE_PRO_PRICE_ID_MONTHLY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
] as const;

function missingEnv(): string[] {
  return REQUIRED_ENV.filter((key) => process.env[key] == null || process.env[key] === "");
}

test.describe("stripe upgrade — stage smoke", () => {
  test.skip(missingEnv().length > 0, `missing env: ${missingEnv().join(", ")}`);

  test("upgrade button reaches Stripe checkout and synthetic webhook upgrades tier in DB", async ({
    baseURL,
    page,
    request,
  }) => {
    //* Arrange
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    let user: null | TransientUser = null;
    try {
      user = await createTransientUser();

      //* Act — sign in, click Upgrade, verify Stripe redirect, then POST
      // a synthetic webhook to prove the full pipeline end-to-end.
      if (baseURL == null) {
        throw new Error("baseURL is required for the smoke harness");
      }
      await signInUser(page.context(), baseURL, user.email, user.password);
      await page.goto("/dashboard/settings");
      await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();
      const main = page.getByRole("main");
      // Settings shows two upgrade buttons (annual primary, monthly secondary).
      // Click the annual one to prove the interval plumbing works end-to-end.
      await main.getByRole("button", { name: `${t.$5Mo} ${t.annual}` }).click();
      const stripeNavigation = page
        .waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 })
        .then(() => "stripe" as const);
      const errorToast = page
        .getByText(t.somethingWentWrongPleaseTryAgain)
        .waitFor({ state: "visible", timeout: 30_000 })
        .then(() => "errorToast" as const);
      const outcome = await Promise.race([stripeNavigation, errorToast.catch(() => null)]).catch(() => null);
      if (outcome !== "stripe") {
        const visibleToasts = await page
          .locator('[role="status"], [data-sonner-toast], li[role="status"]')
          .allTextContents()
          .catch(() => [] as string[]);
        throw new Error(
          [
            `Upgrade click did not reach Stripe checkout within 30s.`,
            `outcome: ${outcome ?? "timeout"}`,
            `currentUrl: ${page.url()}`,
            `visibleToasts: ${JSON.stringify(visibleToasts)}`,
            `consoleErrors: ${JSON.stringify(consoleErrors.slice(-5))}`,
          ].join("\n"),
        );
      }
      // Simulate the webhook Stripe would fire after a successful payment.
      // Signed with stage's real STRIPE_WEBHOOK_SECRET so the live
      // endpoint's signature verification passes.
      const userId = await getUserIdByUsername(user.username);
      if (userId == null) {
        throw new Error(`transient user ${user.username} not found in DB`);
      }
      const payload = buildCheckoutCompletedPayload({
        customerId: `cus_smoke_${Date.now()}`,
        subscriptionId: `sub_smoke_${Date.now()}`,
        userId: userId,
      });
      const signature = signStripePayload(payload, process.env.STRIPE_WEBHOOK_SECRET as string);
      const webhookRes = await request.post("/api/stripe/webhook", {
        data: payload,
        headers: {
          "content-type": "application/json",
          "stripe-signature": signature,
        },
      });

      //* Assert — webhook accepted, DB reflects the upgrade
      expect(webhookRes.status()).toBe(200);
      await expect
        .poll(async () => (user != null ? (await getUserBilling(user.username))?.tier : null), {
          intervals: [250, 500, 1000],
          timeout: 10_000,
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
