import { and, asc, count, eq } from "drizzle-orm";
import { db } from "../client";
import { customThemesTable } from "../schema/custom-theme";

export async function getCustomThemesByUserId(userId: string) {
  return db
    .select()
    .from(customThemesTable)
    .where(eq(customThemesTable.userId, userId))
    .orderBy(asc(customThemesTable.createdAt));
}

export async function getCustomThemeById(themeId: string, userId: string) {
  const [theme] = await db
    .select()
    .from(customThemesTable)
    .where(and(eq(customThemesTable.id, themeId), eq(customThemesTable.userId, userId)))
    .limit(1);

  return theme ?? null;
}

export async function countCustomThemesByUserId(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(customThemesTable)
    .where(eq(customThemesTable.userId, userId));

  return result?.count ?? 0;
}
