import { boolean, date, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { teamsTable } from "./teams";

export const membersTable = pgTable("members", {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  displayName: text("display_name").notNull(),
  id: text("id").primaryKey(),
  isOwner: boolean("is_owner").default(false).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  lastReminderDate: date("last_reminder_date"),
  mode: text("mode").notNull(),
  reminderEnabled: boolean("reminder_enabled").default(false).notNull(),
  reminderTime: text("reminder_time").default("20:00").notNull(),
  status: text("status").default("active").notNull(),
  teamId: text("team_id")
    .notNull()
    .references(
      () => {
        return teamsTable.id;
      },
      { onDelete: "cascade" },
    ),
  timeZone: text("time_zone").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
