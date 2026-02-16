import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  displayName: text("display_name"),
  id: text("id").primaryKey(),
  theme: text("theme").default("minimal").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  username: text("username").unique().notNull(),
});
