import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { referralCodesTable } from "./referral-code";
import { usersTable } from "./user";

export const referralRedemptionsTable = pgTable(
  "referral_redemptions",
  {
    codeId: text("code_id")
      .references(() => referralCodesTable.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [unique("referral_redemptions_code_user_unique").on(table.codeId, table.userId)],
);
