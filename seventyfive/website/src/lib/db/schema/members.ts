import { boolean, date, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { groupsTable } from "./groups";

export const membersTable = pgTable("members", {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  displayName: text("display_name").notNull(),
  groupId: text("group_id")
    .notNull()
    .references(
      () => {
        return groupsTable.id;
      },
      { onDelete: "cascade" },
    ),
  id: text("id").primaryKey(),
  isOwner: boolean("is_owner").default(false).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  lastReminderDate: date("last_reminder_date"),
  mode: text("mode").notNull(),
  reminderEnabled: boolean("reminder_enabled").default(false).notNull(),
  reminderTime: text("reminder_time").default("20:00").notNull(),
  status: text("status").default("active").notNull(),
  timeZone: text("time_zone").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
