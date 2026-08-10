import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { betterAuthUserTable } from "./better-auth";

export const pushSubscriptionsTable = pgTable(
  "push_subscriptions",
  {
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    endpoint: text("endpoint").notNull(),
    id: text("id").primaryKey(),
    p256dh: text("p256dh").notNull(),
    userId: text("user_id")
      .notNull()
      .references(
        () => {
          return betterAuthUserTable.id;
        },
        { onDelete: "cascade" },
      ),
  },
  (table) => {
    return [uniqueIndex("push_subscriptions_endpoint_idx").on(table.endpoint)];
  },
);
