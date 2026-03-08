"use server";

import { db } from "@/lib/db/client";
import { linksTable } from "@/lib/db/schema/link";
import { linkSchema } from "@/lib/schemas/link";
import { auth } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResult = {
  error?: string;
  success: boolean;
};

export async function createLink(title: string, url: string): Promise<ActionResult> {
  const { userId } = await auth();

  if (!userId) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const result = linkSchema.safeParse({ title, url });

  if (!result.success) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const maxPosition = await db
    .select({ max: sql<number>`coalesce(max(${linksTable.position}), -1)` })
    .from(linksTable)
    .where(eq(linksTable.userId, userId));

  await db.insert(linksTable).values({
    position: (maxPosition[0]?.max ?? -1) + 1,
    title: result.data.title,
    url: result.data.url,
    userId,
  });

  revalidatePath("/dashboard");

  return { success: true };
}

export async function updateLink(id: string, title: string, url: string): Promise<ActionResult> {
  const { userId } = await auth();

  if (!userId) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const result = linkSchema.safeParse({ title, url });

  if (!result.success) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  const updated = await db
    .update(linksTable)
    .set({ title: result.data.title, url: result.data.url })
    .where(and(eq(linksTable.id, id), eq(linksTable.userId, userId)));

  if (updated.rowCount === 0) {
    return { error: "somethingWentWrongPleaseTryAgain", success: false };
  }

  revalidatePath("/dashboard");

  return { success: true };
}
