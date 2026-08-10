import { boolean, date, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { betterAuthUserTable } from "./better-auth";
import { teamsTable } from "./teams";

export const membersTable = pgTable(
  "members",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    /** @deprecated Prefer user.name; kept populated for roster/migration compatibility. */
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
    /** @deprecated Prefer user.timeZone; kept populated for reminder/migration compatibility. */
    timeZone: text("time_zone").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    userId: text("user_id").references(
      () => {
        return betterAuthUserTable.id;
      },
      { onDelete: "cascade" },
    ),
  },
  (table) => {
    return [uniqueIndex("members_user_team_uniq").on(table.userId, table.teamId)];
  },
);
