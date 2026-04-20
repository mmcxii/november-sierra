import { db } from "@/lib/db/client";
import { ensureQuickLinksGroup } from "@/lib/db/queries/quick-links";
import { usersTable } from "@/lib/db/schema/user";
import { stripe } from "@/lib/stripe";
import { isValidThemeId } from "@/lib/themes";
import { grantPro } from "@/lib/tier.server";
import { removeDomain } from "@/lib/vercel";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

// Fire a PostHog event from the Stripe webhook. Lazy import mirrors
// account-deletion-cleanup so posthog-node stays out of any bundles that
// transitively import this file.
async function capturePosthog(distinctId: string, event: string, properties: Record<string, unknown>): Promise<void> {
  try {
    const { PostHog } = await import("posthog-node");
    const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "", {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    });
    posthog.capture({ distinctId, event, properties });
    await posthog.shutdown();
  } catch (error) {
    console.error(`[stripe webhook] PostHog capture failed for ${event}:`, error);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Hard downgrade — user actually loses Pro access. Called only for terminal
 * subscription states (`unpaid` after all Stripe retry attempts are exhausted,
 * or `deleted` when the subscription period actually ends after cancellation).
 *
 * NOT called for `canceled` (user still has access until period end) or
 * `past_due` (Stripe is still retrying the payment). Those are warning states
 * handled by setting flags that the dashboard banner reads.
 */
async function handleDowngrade(customerId: string): Promise<void> {
  const [user] = await db
    .select({
      customDomain: usersTable.customDomain,
      id: usersTable.id,
      pageDarkTheme: usersTable.pageDarkTheme,
      pageLightTheme: usersTable.pageLightTheme,
      proExpiresAt: usersTable.proExpiresAt,
      shortDomain: usersTable.shortDomain,
    })
    .from(usersTable)
    .where(eq(usersTable.stripeCustomerId, customerId))
    .limit(1);

  if (user == null) {
    return;
  }

  if (user.customDomain != null) {
    try {
      await removeDomain(user.customDomain);
    } catch (error) {
      console.error("[stripe webhook] failed to remove domain from Vercel:", error);
    }
  }

  // The custom short-URL domain is a Pro-only feature and the middleware's
  // resolveShortDomain check is tier-agnostic, so without tearing it down here
  // a canceled pro user would continue to have their anch.to-equivalent host
  // resolving indefinitely.
  if (user.shortDomain != null) {
    try {
      await removeDomain(user.shortDomain);
    } catch (error) {
      console.error("[stripe webhook] failed to remove short domain from Vercel:", error);
    }
  }

  // If user has remaining referral Pro time, keep Pro until it expires
  const hasReferralPro = user.proExpiresAt != null && user.proExpiresAt > new Date();

  // Custom-theme slot assignments are Pro-only. If either slot points at a
  // custom theme (i.e. not a preset ID), reset it to the preset default so the
  // bio page does not keep rendering Pro theming after the user loses Pro.
  // Theme rows are intentionally preserved; re-upgrading restores access.
  const shouldResetDarkSlot = !hasReferralPro && !isValidThemeId(user.pageDarkTheme);
  const shouldResetLightSlot = !hasReferralPro && !isValidThemeId(user.pageLightTheme);

  await db
    .update(usersTable)
    .set({
      billingInterval: null,
      currentPeriodEnd: null,
      customDomain: null,
      customDomainVerified: false,
      // Flag that the domain was removed so the dashboard can show a banner
      // on the user's next visit explaining what happened.
      ...(user.customDomain != null && { domainRemovedAt: new Date() }),
      ...(shouldResetDarkSlot && { pageDarkTheme: "dark-depths" }),
      ...(shouldResetLightSlot && { pageLightTheme: "stateroom" }),
      paymentFailedAt: null,
      shortDomain: null,
      shortDomainVerified: false,
      stripeSubscriptionId: null,
      subscriptionCancelAt: null,
      ...(hasReferralPro ? {} : { proExpiresAt: null, tier: "free" }),
      updatedAt: new Date(),
    })
    .where(eq(usersTable.stripeCustomerId, customerId));
}

/**
 * Extract billing interval from a Stripe subscription's price. Returns
 * "monthly" or "annual" by inspecting `items.data[0].price.recurring`.
 */
function extractBillingInterval(subscription: Stripe.Subscription): null | string {
  const price = subscription.items?.data?.[0]?.price;
  if (price?.recurring == null) {
    return null;
  }
  const { interval, interval_count: count } = price.recurring;
  if (interval === "year" || (interval === "month" && count === 12)) {
    return "annual";
  }
  return "monthly";
}

/**
 * Extract the current period end date from a subscription. In Stripe SDK v21
 * this moved from `subscription.current_period_end` to
 * `subscription.items.data[0].current_period_end`.
 */
function extractPeriodEnd(subscription: Stripe.Subscription): null | Date {
  const periodEnd = subscription.items?.data?.[0]?.current_period_end;
  return periodEnd != null ? new Date(periodEnd * 1000) : null;
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new Response("Missing stripe-signature header or webhook secret", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe webhook] signature verification failed:", error);
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;

      if (userId == null) {
        break;
      }

      // Snapshot the pre-conversion state so we can fire signup_grant_converted
      // with `daysRemaining` computed against the grant that the UPDATE below
      // is about to wipe out (proExpiresAt → null).
      const [preUpdate] = await db
        .select({ proExpiresAt: usersTable.proExpiresAt, referredBy: usersTable.referredBy })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      await db
        .update(usersTable)
        .set({
          // Clear any warning flags from a previous subscription cycle
          paymentFailedAt: null,
          proExpiresAt: null,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          subscriptionCancelAt: null,
          tier: "pro",
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, userId));

      // Fetch the subscription to extract billing metadata
      if (session.subscription != null) {
        try {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const periodEnd = extractPeriodEnd(subscription);
          await db
            .update(usersTable)
            .set({
              billingInterval: extractBillingInterval(subscription),
              currentPeriodEnd: periodEnd,
              updatedAt: new Date(),
            })
            .where(eq(usersTable.id, userId));
        } catch (error) {
          console.error("[stripe webhook] failed to fetch subscription metadata:", error);
        }
      }

      await ensureQuickLinksGroup(userId);

      // Reward referrer if user was referred
      if (preUpdate?.referredBy != null) {
        await grantPro(preUpdate.referredBy, 30);
        await db.update(usersTable).set({ referredBy: null, updatedAt: new Date() }).where(eq(usersTable.id, userId));
      }

      // If this user still had an unexpired signup/referral grant on the clock,
      // they're a trial-to-paid conversion — fire the funnel event so we can
      // plot conversion rate against days-remaining in PostHog.
      if (preUpdate?.proExpiresAt != null && preUpdate.proExpiresAt > new Date()) {
        const daysRemaining = Math.ceil((preUpdate.proExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        await capturePosthog(userId, "signup_grant_converted", { daysRemaining });
      }

      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const periodEnd = extractPeriodEnd(subscription);

      if (subscription.status === "active") {
        // Subscription healthy — clear all warning flags, update billing metadata
        const [updatedUser] = await db
          .update(usersTable)
          .set({
            billingInterval: extractBillingInterval(subscription),
            currentPeriodEnd: periodEnd,
            paymentFailedAt: null,
            subscriptionCancelAt: null,
            tier: "pro",
            updatedAt: new Date(),
          })
          .where(eq(usersTable.stripeCustomerId, customerId))
          .returning({ id: usersTable.id });

        if (updatedUser != null) {
          await ensureQuickLinksGroup(updatedUser.id);
        }
      } else if (subscription.status === "canceled") {
        // User cancelled — they keep Pro until the period ends. Store
        // `cancel_at` so the settings card can show "Your Pro ends on [date]"
        // with a resubscribe CTA.
        const cancelAt = subscription.cancel_at != null ? new Date(subscription.cancel_at * 1000) : periodEnd;

        await db
          .update(usersTable)
          .set({
            currentPeriodEnd: periodEnd,
            subscriptionCancelAt: cancelAt,
            updatedAt: new Date(),
          })
          .where(eq(usersTable.stripeCustomerId, customerId));
      } else if (subscription.status === "past_due") {
        // Payment failed — Stripe is retrying. Keep Pro but flag the
        // failure so the dashboard shows an "update your payment method"
        // banner.
        await db
          .update(usersTable)
          .set({
            currentPeriodEnd: periodEnd,
            paymentFailedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(usersTable.stripeCustomerId, customerId));
      } else if (subscription.status === "unpaid") {
        // All retry attempts exhausted — real downgrade.
        await handleDowngrade(customerId);
      }

      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await handleDowngrade(customerId);

      break;
    }
  }

  return new Response("OK", { status: 200 });
}
