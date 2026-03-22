import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const referralCodesTable = pgTable("referral_codes", {
  active: boolean("active").default(true).notNull(),
  code: text("code").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  creatorId: text("creator_id").references(() => usersTable.id, { onDelete: "set null" }),
  currentRedemptions: integer("current_redemptions").default(0).notNull(),
  durationDays: integer("duration_days"),
  expiresAt: timestamp("expires_at"),
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  maxRedemptions: integer("max_redemptions"),
  note: text("note"),
  type: text("type").notNull(),
});
