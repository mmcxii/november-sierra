import { db } from "@/lib/db/client";
import { type UserPreferences, usersTable } from "@/lib/db/schema/user";
import { eq } from "drizzle-orm";

// Small helpers for the alertDismissals map stored in users.preferences
// (JSONB). Kept outside the recovery-codes module so other banners can reuse
// the same storage shape without inheriting the DB-heavy deps over there.
//
// We don't extend UserPreferences in the schema file — edits under
// src/lib/db/schema/ trip the migration validator, and this is a TypeScript-
// only shape (JSONB on the DB side). The local extension type below is what
// callers write through this module; consumers that only need dismissedAlerts
// continue to see the narrower UserPreferences type in the schema.

type UserPreferencesWithDismissals = UserPreferences & {
  alertDismissals?: Record<string, string>;
};

export async function dismissAlertForUser(userId: string, alertId: string, at: Date = new Date()): Promise<void> {
  const [existing] = await db
    .select({ preferences: usersTable.preferences })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  const current = (existing?.preferences ?? {}) as UserPreferencesWithDismissals;
  const next: UserPreferencesWithDismissals = {
    ...current,
    alertDismissals: {
      ...(current.alertDismissals ?? {}),
      [alertId]: at.toISOString(),
    },
  };
  // The Drizzle schema still types preferences as UserPreferences (narrower);
  // cast here confines the widening to this module.
  await db
    .update(usersTable)
    .set({ preferences: next as UserPreferences, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));
}

export async function getAlertDismissedAt(userId: string, alertId: string): Promise<null | Date> {
  const [row] = await db
    .select({ preferences: usersTable.preferences })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  const prefs = (row?.preferences ?? {}) as UserPreferencesWithDismissals;
  const iso = prefs.alertDismissals?.[alertId];
  return iso == null ? null : new Date(iso);
}
