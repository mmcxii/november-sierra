import { boolean, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { webhooksTable } from "./webhook";

export const webhookDeliveriesTable = pgTable(
  "webhook_deliveries",
  {
    attempt: integer("attempt").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    event: text("event").notNull(),
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    statusCode: integer("status_code"),
    success: boolean("success").notNull(),
    webhookId: text("webhook_id")
      .references(() => webhooksTable.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    index("webhook_deliveries_webhook_id_created_at_idx").on(table.webhookId, table.createdAt),
    index("webhook_deliveries_success_attempt_idx").on(table.success, table.attempt),
  ],
);
