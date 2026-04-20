import { usersTable } from "@/lib/db/schema/user";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { beforeEach, describe, expect, it, vi } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- drizzle/pglite typing
let db: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PGlite instance
let client: any;

vi.mock("@/lib/db/client", () => ({
  get db() {
    return db;
  },
}));

async function seedUser(id: string, preferences: unknown = {}): Promise<void> {
  await client.exec(
    `INSERT INTO users (id, username, preferences) VALUES ('${id}', '${id}-name', '${JSON.stringify(preferences)}'::jsonb)`,
  );
}

beforeEach(async () => {
  client = new PGlite();
  db = drizzle(client);
  await client.exec(`
    CREATE TABLE users (
      avatar_url TEXT, billing_interval TEXT, bio TEXT,
      created_at TIMESTAMP DEFAULT now() NOT NULL, current_period_end TIMESTAMP,
      custom_avatar BOOLEAN DEFAULT false NOT NULL, custom_domain TEXT UNIQUE,
      custom_domain_verified BOOLEAN DEFAULT false NOT NULL, display_name TEXT,
      domain_removed_at TIMESTAMP, hide_branding BOOLEAN DEFAULT false NOT NULL,
      id TEXT PRIMARY KEY, nostr_npub TEXT, nostr_profile_fetched_at TIMESTAMP,
      nostr_relays TEXT, onboarding_complete BOOLEAN DEFAULT false NOT NULL,
      page_dark_enabled BOOLEAN DEFAULT true NOT NULL,
      page_dark_theme TEXT DEFAULT 'dark-depths' NOT NULL,
      page_light_enabled BOOLEAN DEFAULT true NOT NULL,
      page_light_theme TEXT DEFAULT 'stateroom' NOT NULL,
      payment_failed_at TIMESTAMP, preferences JSONB DEFAULT '{}' NOT NULL,
      pro_expires_at TIMESTAMP, referred_by TEXT, short_domain TEXT UNIQUE,
      short_domain_verified BOOLEAN DEFAULT false NOT NULL,
      stripe_customer_id TEXT UNIQUE, stripe_subscription_id TEXT,
      subscription_cancel_at TIMESTAMP, tier TEXT DEFAULT 'free' NOT NULL,
      updated_at TIMESTAMP DEFAULT now() NOT NULL,
      use_nostr_profile BOOLEAN DEFAULT false NOT NULL,
      username TEXT UNIQUE NOT NULL
    );
  `);
});

describe("dismissAlertForUser + getAlertDismissedAt", () => {
  it("persists a dismissal timestamp and reads it back", async () => {
    //* Arrange
    await seedUser("user_a");
    const at = new Date("2026-04-20T10:00:00Z");
    const { dismissAlertForUser, getAlertDismissedAt } = await import("./alert-dismissals");

    //* Act
    await dismissAlertForUser("user_a", "recovery-enrollment", at);
    const read = await getAlertDismissedAt("user_a", "recovery-enrollment");

    //* Assert
    expect(read?.toISOString()).toBe(at.toISOString());
  });

  it("preserves unrelated preference keys when writing", async () => {
    //* Arrange
    await seedUser("user_b", { dismissedAlerts: ["unrelated-legacy-alert"] });
    const at = new Date("2026-04-20T10:00:00Z");
    const { dismissAlertForUser } = await import("./alert-dismissals");

    //* Act
    await dismissAlertForUser("user_b", "recovery-enrollment", at);
    const [row] = await db.select().from(usersTable).where(eq(usersTable.id, "user_b"));

    //* Assert
    expect(row.preferences.alertDismissals).toEqual({ "recovery-enrollment": at.toISOString() });
    expect(row.preferences.dismissedAlerts).toEqual(["unrelated-legacy-alert"]);
  });

  it("returns null when nothing has been dismissed", async () => {
    //* Arrange
    await seedUser("user_c");
    const { getAlertDismissedAt } = await import("./alert-dismissals");

    //* Act
    const read = await getAlertDismissedAt("user_c", "recovery-enrollment");

    //* Assert
    expect(read).toBeNull();
  });

  it("overwrites a prior dismissal timestamp when the same alert is re-dismissed", async () => {
    //* Arrange
    await seedUser("user_d");
    const first = new Date("2026-04-20T10:00:00Z");
    const second = new Date("2026-04-27T10:00:00Z");
    const { dismissAlertForUser, getAlertDismissedAt } = await import("./alert-dismissals");

    //* Act
    await dismissAlertForUser("user_d", "recovery-enrollment", first);
    await dismissAlertForUser("user_d", "recovery-enrollment", second);
    const read = await getAlertDismissedAt("user_d", "recovery-enrollment");

    //* Assert
    expect(read?.toISOString()).toBe(second.toISOString());
  });
});
