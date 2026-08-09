import { date, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const teamsTable = pgTable("teams", {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  endDate: date("end_date").notNull(),
  id: text("id").primaryKey(),
  /** High-entropy invite secret (capability URL). Shown to members for sharing. */
  inviteCode: text("invite_code").notNull().unique(),
  name: text("name").notNull(),
  ownerMemberId: text("owner_member_id"),
  startDate: date("start_date").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
