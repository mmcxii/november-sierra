import { expect, test } from "./fixtures/auth";
import { getUserBilling, getUserIdByUsername, setUserBilling } from "./fixtures/db";
import {
  buildCheckoutCompletedPayload,
  buildSubscriptionDeletedPayload,
  signStripePayload,
} from "./fixtures/stripe-webhook";
import { testUsers } from "./fixtures/test-users";

/**
 * Signed-webhook integration coverage.
 *
 * Previous coverage (unit tests at `src/app/api/stripe/webhook/route.test.ts`)
 * mocks `stripe.webhooks.constructEvent`, so it proves the BUSINESS LOGIC is
 * correct but NOT that:
 *   • the route is actually reachable (middleware doesn't block it)
 *   • signature verification accepts a real HMAC produced against the same
 *     secret the dev server validates against
 *   • the update lands in the real Postgres schema (columns are named right,
 *     types line up, the shim in tests matches production)
 *
 * This spec closes those gaps by POSTing real signed payloads to the live
 * dev server launched by Playwright, then reading the DB via Neon.
 *
 * Requires `STRIPE_WEBHOOK_SECRET` in the test env. If unset (e.g. a
 * contributor running Playwright without a full `.env.local`), the suite is
 * skipped rather than failing loudly — local runs without billing setup
 * shouldn't be blocked.
 */

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const WEBHOOK_PATH = "/api/stripe/webhook";

test.describe("stripe webhook — signed deliveries against the live route", () => {
  test.skip(WEBHOOK_SECRET == null, "STRIPE_WEBHOOK_SECRET must be set (matching the dev server's env)");

  test("checkout.session.completed with a valid signature upgrades the user in the DB", async ({ request }) => {
    //* Arrange — start from a known free state and resolve the admin clerk id
    await setUserBilling(testUsers.admin.username, {
      proExpiresAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      tier: "free",
    });
    const adminClerkId = await getUserIdByUsername(testUsers.admin.username);
    if (adminClerkId == null) {
      throw new Error(`admin user ${testUsers.admin.username} missing from seeded DB`);
    }
    const payload = buildCheckoutCompletedPayload({
      clerkUserId: adminClerkId,
      customerId: "cus_signed_upgrade",
      subscriptionId: "sub_signed_upgrade",
    });
    const signature = signStripePayload(payload, WEBHOOK_SECRET as string);

    try {
      //* Act
      const res = await request.post(WEBHOOK_PATH, {
        data: payload,
        headers: { "content-type": "application/json", "stripe-signature": signature },
      });

      //* Assert — route accepts signature and DB reflects the upgrade
      expect(res.status()).toBe(200);
      await expect
        .poll(async () => (await getUserBilling(testUsers.admin.username))?.tier, {
          intervals: [250, 500, 1000],
          timeout: 10_000,
        })
        .toBe("pro");
      const billing = await getUserBilling(testUsers.admin.username);
      expect(billing?.stripeCustomerId).toBe("cus_signed_upgrade");
      expect(billing?.stripeSubscriptionId).toBe("sub_signed_upgrade");
      expect(billing?.proExpiresAt).toBeNull();
    } finally {
      await setUserBilling(testUsers.admin.username, {
        proExpiresAt: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        tier: "free",
      });
    }
  });

  test("customer.subscription.deleted with a valid signature downgrades the user", async ({ request }) => {
    //* Arrange — seed admin as pro with a known stripe customer id
    await setUserBilling(testUsers.admin.username, {
      proExpiresAt: null,
      stripeCustomerId: "cus_signed_downgrade",
      stripeSubscriptionId: "sub_signed_downgrade",
      tier: "pro",
    });
    const payload = buildSubscriptionDeletedPayload({ customerId: "cus_signed_downgrade" });
    const signature = signStripePayload(payload, WEBHOOK_SECRET as string);

    try {
      //* Act
      const res = await request.post(WEBHOOK_PATH, {
        data: payload,
        headers: { "content-type": "application/json", "stripe-signature": signature },
      });

      //* Assert
      expect(res.status()).toBe(200);
      await expect
        .poll(async () => (await getUserBilling(testUsers.admin.username))?.tier, {
          intervals: [250, 500, 1000],
          timeout: 10_000,
        })
        .toBe("free");
      const billing = await getUserBilling(testUsers.admin.username);
      expect(billing?.stripeSubscriptionId).toBeNull();
    } finally {
      await setUserBilling(testUsers.admin.username, {
        proExpiresAt: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        tier: "free",
      });
    }
  });

  test("rejects requests with no stripe-signature header (400)", async ({ request }) => {
    //* Act
    const res = await request.post(WEBHOOK_PATH, {
      data: buildCheckoutCompletedPayload({ clerkUserId: "anything" }),
      headers: { "content-type": "application/json" },
    });

    //* Assert
    expect(res.status()).toBe(400);
  });

  test("rejects requests with an invalid signature (400)", async ({ request }) => {
    //* Act
    const res = await request.post(WEBHOOK_PATH, {
      data: buildCheckoutCompletedPayload({ clerkUserId: "anything" }),
      headers: { "content-type": "application/json", "stripe-signature": "t=0,v1=deadbeef" },
    });

    //* Assert
    expect(res.status()).toBe(400);
  });
});
