import { ShortLinksContent } from "@/components/dashboard/short-links-content";
import { requireUser } from "@/lib/auth";
import { shortDomainUrl } from "@/lib/constants/short-domain";
import { db } from "@/lib/db/client";
import { shortLinksTable } from "@/lib/db/schema/short-link";
import { initTranslations } from "@/lib/i18n/server";
import { countShortLinksThisMonth } from "@/lib/services/short-link";
import { FREE_TIER_SHORT_LINK_MONTHLY_CAP, isProUser } from "@/lib/tier";
import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Short Links",
};

const ShortLinksPage: React.FC = async () => {
  const user = await requireUser();
  const { t } = await initTranslations();
  const isPro = isProUser(user);

  const [rows, usedThisMonth] = await Promise.all([
    db
      .select()
      .from(shortLinksTable)
      .where(eq(shortLinksTable.userId, user.id))
      .orderBy(desc(shortLinksTable.createdAt)),
    isPro ? Promise.resolve(0) : countShortLinksThisMonth(user.id),
  ]);

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
        isPro={isPro}
        monthlyCap={FREE_TIER_SHORT_LINK_MONTHLY_CAP}
        shortLinks={shortLinks}
        usedThisMonth={usedThisMonth}
      />
    </div>
  );
};

export default ShortLinksPage;
