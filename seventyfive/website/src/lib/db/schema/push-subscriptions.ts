import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { membersTable } from "./members";

export const pushSubscriptionsTable = pgTable(
  "push_subscriptions",
  {
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    endpoint: text("endpoint").notNull(),
    id: text("id").primaryKey(),
    memberId: text("member_id")
      .notNull()
      .references(
        () => {
          return membersTable.id;
        },
        { onDelete: "cascade" },
      ),
    p256dh: text("p256dh").notNull(),
  },
  (table) => {
    return [uniqueIndex("push_subscriptions_endpoint_idx").on(table.endpoint)];
  },
);
