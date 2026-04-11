import "dotenv/config";
import { createClerkClient } from "@clerk/backend";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { boolean, pgTable, text } from "drizzle-orm/pg-core";
import Stripe from "stripe";

/**
 * Transient-user lifecycle for smoke tests that need to drive a full purchase
 * flow end-to-end against real Stripe.
 *
 * Creates a throwaway Clerk user + DB row scoped to a single test run. The
 * destroy helper cleans up ALL side effects — Stripe customers (and their
 * subscriptions), the DB row, and the Clerk user — even if the test failed
 * mid-flow. Stripe lookup happens by email (not by DB-stored customer id) so
 * cleanup works even when the webhook hasn't round-tripped yet.
 *
 * NEVER use this in non-smoke tests. It mutates real Clerk/Stripe state.
 */

const usersTable = pgTable("users", {
  displayName: text("display_name"),
  id: text("id").primaryKey(),
  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  tier: text("tier").default("free").notNull(),
  username: text("username").unique().notNull(),
});

export type TransientUser = {
  clerkId: string;
  email: string;
  password: string;
  username: string;
};

function getClerk() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (secretKey == null) {
    throw new Error("CLERK_SECRET_KEY is required for transient-user helpers");
  }
  return createClerkClient({ secretKey });
}

function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl == null) {
    throw new Error("DATABASE_URL is required for transient-user helpers");
  }
  return drizzle(neon(databaseUrl));
}

function getStripe(): null | Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (key == null) {
    return null;
  }
  return new Stripe(key);
}

/**
 * Short random token so usernames + emails collide across parallel runs.
 * Uses hex so it's always Clerk-username-safe.
 */
function shortId(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Create a fresh Clerk user + users-table row. Returns the info needed to
 * sign in and later clean up.
 */
export async function createTransientUser(): Promise<TransientUser> {
  const password = process.env.E2E_USER_PASSWORD;
  if (password == null) {
    throw new Error("E2E_USER_PASSWORD is required for transient-user helpers");
  }

  const clerk = getClerk();
  const db = getDb();

  const id = shortId();
  const username = `smoke${id}`;
  const email = `smoke-${id}@anchr.to`;

  const created = await clerk.users.createUser({
    emailAddress: [email],
    firstName: "Smoke",
    lastName: "Test",
    password,
    skipPasswordChecks: true,
    username,
  });

  await db.insert(usersTable).values({
    displayName: "Smoke Test",
    id: created.id,
    onboardingComplete: true,
    tier: "free",
    username,
  });

  return { clerkId: created.id, email, password, username };
}

/**
 * Tear down every side effect the transient user may have produced.
 *
 * Order matters:
 *   1. Cancel any Stripe subscriptions owned by this email — if the webhook
 *      never round-tripped, the DB row has no stripeSubscriptionId, so we
 *      list by email via the Stripe API.
 *   2. Delete any Stripe customers with this email.
 *   3. Delete the DB row (so subsequent runs can reuse the username slot).
 *   4. Delete the Clerk user.
 *
 * Every step is try/catch-wrapped so one failure doesn't skip the rest —
 * the worst case is that a stripe customer with an orphan email lingers,
 * which is safe in test mode.
 */
export async function destroyTransientUser(user: TransientUser): Promise<void> {
  const clerk = getClerk();
  const db = getDb();
  const stripe = getStripe();

  // 1 + 2. Stripe cleanup — only if we have a key configured
  if (stripe != null) {
    try {
      const customers = await stripe.customers.list({ email: user.email, limit: 10 });
      for (const customer of customers.data) {
        try {
          const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 10 });
          for (const sub of subs.data) {
            await stripe.subscriptions.cancel(sub.id).catch(() => null);
          }
          await stripe.customers.del(customer.id).catch(() => null);
        } catch {
          // keep going — don't let one customer block the rest of teardown
        }
      }
    } catch {
      // Stripe outage shouldn't block Clerk/DB cleanup
    }
  }

  // 3. DB row
  try {
    await db.delete(usersTable).where(eq(usersTable.id, user.clerkId));
  } catch {
    // swallow — the row may not exist if the setup failed before insert
  }

  // 4. Clerk user
  try {
    await clerk.users.deleteUser(user.clerkId);
  } catch {
    // same as above
  }
}
