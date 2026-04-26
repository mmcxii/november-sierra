import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { hash as argon2Hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { boolean, pgTable, text } from "drizzle-orm/pg-core";
import Stripe from "stripe";

/**
 * Transient-user lifecycle for smoke tests that need to drive a full purchase
 * flow end-to-end against real Stripe.
 *
 * Creates a throwaway BA user (ba_user + ba_account + users) scoped to a
 * single test run. The destroy helper cleans up ALL side effects — Stripe
 * customers (and their subscriptions), the application users row, and the
 * BA identity row — even if the test failed mid-flow. Stripe lookup happens
 * by email (not by DB-stored customer id) so cleanup works even when the
 * webhook hasn't round-tripped yet.
 *
 * NEVER use this in non-smoke tests. It mutates real Stripe state.
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

const baUserTable = pgTable("ba_user", {
  email: text("email").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

const baAccountTable = pgTable("ba_account", {
  accountId: text("account_id").notNull(),
  id: text("id").primaryKey(),
  password: text("password"),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull(),
});

export type TransientUser = {
  email: string;
  id: string;
  password: string;
  username: string;
};

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
 * Short random token so usernames + emails don't collide across parallel runs.
 * Hex so it's always BA-username-safe.
 */
function shortId(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Create a fresh BA + application user pair. Returns the info needed to
 * sign in (via fixtures/auth.ts:signInUser) and later clean up.
 */
export async function createTransientUser(): Promise<TransientUser> {
  const password = process.env.E2E_USER_PASSWORD;
  if (password == null) {
    throw new Error("E2E_USER_PASSWORD is required for transient-user helpers");
  }

  const db = getDb();

  const sid = shortId();
  const id = `smoke_${sid}`;
  const username = `smoke${sid}`;
  const email = `smoke-${sid}@anchr.to`;

  const passwordHash = await argon2Hash(password, { memoryCost: 8, outputLen: 32, parallelism: 1, timeCost: 1 });

  await db.insert(baUserTable).values({
    email,
    emailVerified: true,
    id,
    name: "Smoke Test",
  });

  await db.insert(baAccountTable).values({
    accountId: id,
    id: `ba-account-${id}`,
    password: passwordHash,
    providerId: "credential",
    userId: id,
  });

  await db.insert(usersTable).values({
    displayName: "Smoke Test",
    id,
    onboardingComplete: true,
    tier: "free",
    username,
  });

  return { email, id, password, username };
}

/**
 * Tear down every side effect the transient user may have produced.
 *
 * Order matters:
 *   1. Cancel any Stripe subscriptions owned by this email — if the webhook
 *      never round-tripped, the DB row has no stripeSubscriptionId, so we
 *      list by email via the Stripe API.
 *   2. Delete any Stripe customers with this email.
 *   3. Delete the application users row.
 *   4. Delete the BA identity row (cascade handles ba_session/ba_account/etc.).
 *
 * Every step is try/catch-wrapped so one failure doesn't skip the rest —
 * the worst case is that a stripe customer with an orphan email lingers,
 * which is safe in test mode.
 */
export async function destroyTransientUser(user: TransientUser): Promise<void> {
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
      // Stripe outage shouldn't block DB cleanup
    }
  }

  // 3. Application users row
  try {
    await db.delete(usersTable).where(eq(usersTable.id, user.id));
  } catch {
    // swallow — the row may not exist if the setup failed before insert
  }

  // 4. BA identity row (cascade clears ba_session/ba_account/ba_two_factor/recovery_*)
  try {
    await db.delete(baUserTable).where(eq(baUserTable.id, user.id));
  } catch {
    // same as above
  }
}
