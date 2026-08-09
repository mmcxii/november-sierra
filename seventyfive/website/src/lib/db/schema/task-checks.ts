import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { dayCompletionsTable } from "./day-completions";

export const taskChecksTable = pgTable(
  "task_checks",
  {
    checkedAt: timestamp("checked_at").defaultNow().notNull(),
    dayCompletionId: text("day_completion_id")
      .notNull()
      .references(
        () => {
          return dayCompletionsTable.id;
        },
        { onDelete: "cascade" },
      ),
    id: text("id").primaryKey(),
    taskId: text("task_id").notNull(),
  },
  (table) => {
    return [uniqueIndex("task_checks_day_task_idx").on(table.dayCompletionId, table.taskId)];
  },
);
