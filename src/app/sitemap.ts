import { db } from "@/lib/db/client";
import { usersTable } from "@/lib/db/schema/user";
import { envSchema } from "@/lib/env";
import { and, eq } from "drizzle-orm";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = envSchema.NEXT_PUBLIC_APP_URL;

  const users = await db
    .select({ updatedAt: usersTable.updatedAt, username: usersTable.username })
    .from(usersTable)
    .where(and(eq(usersTable.onboardingComplete, true), eq(usersTable.customDomainVerified, false)));

  const userEntries: MetadataRoute.Sitemap = users.map((user) => ({
    changeFrequency: "weekly",
    lastModified: user.updatedAt,
    url: `${baseUrl}/${user.username}`,
  }));

  return [
    { changeFrequency: "weekly", url: baseUrl },
    { changeFrequency: "monthly", url: `${baseUrl}/pricing` },
    { url: `${baseUrl}/legal/privacy` },
    { url: `${baseUrl}/legal/terms` },
    ...userEntries,
  ];
}
