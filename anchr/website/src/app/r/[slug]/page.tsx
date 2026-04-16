import { db } from "@/lib/db/client";
import { linksTable } from "@/lib/db/schema/link";
import { shortLinksTable } from "@/lib/db/schema/short-link";
import { shortSlugsTable } from "@/lib/db/schema/short-slug";
import { usersTable } from "@/lib/db/schema/user";
import { envSchema } from "@/lib/env";
import { recordClick } from "@/lib/services/click-tracking";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";

export const dynamic = "force-dynamic";

type Params = { slug: string };

const ShortRedirectPage = async (props: { params: Promise<Params> }) => {
  const { slug } = await props.params;
  const appUrl = envSchema.NEXT_PUBLIC_APP_URL;
  const headerList = await headers();
  const shortDomainUsername = headerList.get("x-short-domain-username");

  // ─── Custom short domain: resolve custom slug for the domain owner ────────
  if (shortDomainUsername != null) {
    // Look up the domain owner
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, shortDomainUsername))
      .limit(1);

    if (user == null) {
      redirect(appUrl);
      return null;
    }

    // Check short_links with customSlug first
    const [shortLink] = await db
      .select({
        expiresAt: shortLinksTable.expiresAt,
        id: shortLinksTable.id,
        passwordHash: shortLinksTable.passwordHash,
        url: shortLinksTable.url,
        userId: shortLinksTable.userId,
      })
      .from(shortLinksTable)
      .where(and(eq(shortLinksTable.userId, user.id), eq(shortLinksTable.customSlug, slug.toLowerCase())))
      .limit(1);

    if (shortLink != null) {
      if (shortLink.expiresAt != null && shortLink.expiresAt < new Date()) {
        redirect(appUrl);
        return null;
      }

      if (shortLink.passwordHash != null) {
        redirect(`${appUrl}/unlock/${slug}`);
        return null;
      }

      after(() =>
        recordClick(headerList, { shortLinkId: shortLink.id, source: "short_url", userId: shortLink.userId }),
      );

      redirect(shortLink.url);
      return null;
    }

    // Check bio links with customShortSlug
    const [bioLink] = await db
      .select({
        id: linksTable.id,
        url: linksTable.url,
        userId: linksTable.userId,
        visible: linksTable.visible,
      })
      .from(linksTable)
      .where(and(eq(linksTable.userId, user.id), eq(linksTable.customShortSlug, slug.toLowerCase())))
      .limit(1);

    if (bioLink != null && bioLink.visible) {
      after(() => recordClick(headerList, { linkId: bioLink.id, source: "short_url", userId: bioLink.userId }));

      redirect(bioLink.url);
      return null;
    }

    redirect(appUrl);
    return null;
  }

  // ─── Global short domain: resolve from short_slugs registry ────────────────
  const [slugRow] = await db
    .select({
      linkId: shortSlugsTable.linkId,
      shortLinkId: shortSlugsTable.shortLinkId,
      tombstoned: shortSlugsTable.tombstoned,
      type: shortSlugsTable.type,
      userId: shortSlugsTable.userId,
    })
    .from(shortSlugsTable)
    .where(eq(shortSlugsTable.slug, slug.toLowerCase()))
    .limit(1);

  if (slugRow == null || slugRow.tombstoned) {
    redirect(appUrl);
    return null;
  }

  // ─── Bio link redirect ────────────────────────────────────────────────────
  if (slugRow.type === "bio" && slugRow.linkId != null) {
    const [link] = await db
      .select({
        id: linksTable.id,
        url: linksTable.url,
        userId: linksTable.userId,
        visible: linksTable.visible,
      })
      .from(linksTable)
      .where(eq(linksTable.id, slugRow.linkId))
      .limit(1);

    if (link == null || !link.visible) {
      redirect(appUrl);
      return null;
    }

    after(() => recordClick(headerList, { linkId: link.id, source: "short_url", userId: link.userId }));

    redirect(link.url);
    return null;
  }

  // ─── Transitory short link redirect ───────────────────────────────────────
  if (slugRow.type === "transitory" && slugRow.shortLinkId != null) {
    const [shortLink] = await db
      .select({
        expiresAt: shortLinksTable.expiresAt,
        id: shortLinksTable.id,
        passwordHash: shortLinksTable.passwordHash,
        url: shortLinksTable.url,
        userId: shortLinksTable.userId,
      })
      .from(shortLinksTable)
      .where(eq(shortLinksTable.id, slugRow.shortLinkId))
      .limit(1);

    if (shortLink == null) {
      redirect(appUrl);
      return null;
    }

    // Check expiry
    if (shortLink.expiresAt != null && shortLink.expiresAt < new Date()) {
      redirect(appUrl);
      return null;
    }

    // Password-protected → redirect to unlock page on main app
    if (shortLink.passwordHash != null) {
      redirect(`${appUrl}/unlock/${slug}`);
      return null;
    }

    after(() => recordClick(headerList, { shortLinkId: shortLink.id, source: "short_url", userId: shortLink.userId }));

    redirect(shortLink.url);
    return null;
  }

  redirect(appUrl);
  return null;
};

export default ShortRedirectPage;
