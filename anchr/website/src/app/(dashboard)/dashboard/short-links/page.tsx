import { ShortLinksContent } from "@/components/dashboard/short-links-content";
import { requireUser } from "@/lib/auth";
import { shortDomainUrl } from "@/lib/constants/short-domain";
import { db } from "@/lib/db/client";
import { shortLinksTable } from "@/lib/db/schema/short-link";
import { initTranslations } from "@/lib/i18n/server";
import { isProUser } from "@/lib/tier";
import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Short Links",
};

const ShortLinksPage: React.FC = async () => {
  const user = await requireUser();
  const { t } = await initTranslations();

  const rows = await db
    .select()
    .from(shortLinksTable)
    .where(eq(shortLinksTable.userId, user.id))
    .orderBy(desc(shortLinksTable.createdAt));

  const shortLinks = rows.map((row) => ({
    createdAt: row.createdAt.toISOString(),
    customSlug: row.customSlug,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    id: row.id,
    passwordProtected: row.passwordHash != null,
    shortUrl: shortDomainUrl(row.slug),
    slug: row.slug,
    url: row.url,
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("shortLinks")}</h1>
      <ShortLinksContent
        customShortDomain={user.shortDomain != null && user.shortDomainVerified ? user.shortDomain : null}
        isPro={isProUser(user)}
        shortLinks={shortLinks}
      />
    </div>
  );
};

export default ShortLinksPage;
