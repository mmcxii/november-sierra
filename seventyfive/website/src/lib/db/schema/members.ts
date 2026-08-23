import { boolean, date, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { betterAuthUserTable } from "./better-auth";
import { teamsTable } from "./teams";

export const membersTable = pgTable(
  "members",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    /** @deprecated Prefer user.name; kept populated for roster/migration compatibility. */
    displayName: text("display_name").notNull(),
    /** Completed Hard days at the moment of a Hard→Soft conversion. Null if they never left Hard. */
    hardCompletedDays: integer("hard_completed_days"),
    id: text("id").primaryKey(),
    isOwner: boolean("is_owner").default(false).notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    lastReminderDate: date("last_reminder_date"),
    /** Team-complete date this member has already seen the board celebration for. */
    lastTeamCelebrationDate: date("last_team_celebration_date"),
    mode: text("mode").notNull(),
    /** When true, Hard requires a progress photo only on startDate and endDate. */
    progressPhotoEndsOnly: boolean("progress_photo_ends_only").default(false).notNull(),
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
