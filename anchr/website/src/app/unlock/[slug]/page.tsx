import { db } from "@/lib/db/client";
import { shortLinksTable } from "@/lib/db/schema/short-link";
import { shortSlugsTable } from "@/lib/db/schema/short-slug";
import { envSchema } from "@/lib/env";
import { initTranslations } from "@/lib/i18n/server";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UnlockForm } from "./unlock-form";

export const metadata: Metadata = {
  title: "Unlock Link",
};

type UnlockPageProps = {
  params: Promise<{ slug: string }>;
};

const UnlockPage = async (props: UnlockPageProps) => {
  const { slug } = await props.params;
  const appUrl = envSchema.NEXT_PUBLIC_APP_URL;

  // Verify the slug exists and is password-protected
  const [slugRow] = await db
    .select({
      shortLinkId: shortSlugsTable.shortLinkId,
      tombstoned: shortSlugsTable.tombstoned,
    })
    .from(shortSlugsTable)
    .where(eq(shortSlugsTable.slug, slug.toLowerCase()))
    .limit(1);

  if (slugRow == null || slugRow.tombstoned || slugRow.shortLinkId == null) {
    redirect(appUrl);
  }

  const [shortLink] = await db
    .select({
      expiresAt: shortLinksTable.expiresAt,
      passwordHash: shortLinksTable.passwordHash,
    })
    .from(shortLinksTable)
    .where(eq(shortLinksTable.id, slugRow.shortLinkId))
    .limit(1);

  if (shortLink == null || shortLink.passwordHash == null) {
    redirect(appUrl);
  }

  if (shortLink.expiresAt != null && shortLink.expiresAt < new Date()) {
    redirect(appUrl);
  }

  const { t } = await initTranslations("en-US");

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{t("thisLinkIsPasswordProtected")}</h1>
          <p className="text-muted-foreground text-sm">{t("enterThePasswordToContinue")}</p>
        </div>
        <UnlockForm slug={slug} />
      </div>
    </div>
  );
};

export default UnlockPage;
