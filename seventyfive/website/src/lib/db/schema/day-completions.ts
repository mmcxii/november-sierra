import { date, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { membersTable } from "./members";

export const dayCompletionsTable = pgTable(
  "day_completions",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    date: date("date").notNull(),
    id: text("id").primaryKey(),
    memberId: text("member_id")
      .notNull()
      .references(
        () => {
          return membersTable.id;
        },
        { onDelete: "cascade" },
      ),
  },
  (table) => {
    return [uniqueIndex("day_completions_member_date_idx").on(table.memberId, table.date)];
  },
);
