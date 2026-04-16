import { JsonLd } from "@/components/json-ld";
import { Footer } from "@/components/link-page/footer";
import { LinkList } from "@/components/link-page/link-list";
import { ProfileHeader } from "@/components/link-page/profile-header";
import { ThemeProvider } from "@/components/link-page/theme-provider";
import { LinkPageThemeToggle } from "@/components/link-page/theme-toggle";
import { Container } from "@/components/ui/container";
import { db } from "@/lib/db/client";
import { linksTable } from "@/lib/db/schema/link";
import { linkGroupsTable } from "@/lib/db/schema/link-group";
import { usersTable } from "@/lib/db/schema/user";
import { buildGroupJsonLd } from "@/lib/json-ld";
import { recordClick } from "@/lib/services/click-tracking";
import { type ThemeId, isValidThemeId } from "@/lib/themes";
import { isProUser } from "@/lib/tier";
import { and, asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import * as React from "react";

export const revalidate = 60;
export const dynamicParams = true;

type Params = { slug: string; username: string };

async function resolveSlug(username: string, slug: string) {
  const normalizedSlug = slug.toLowerCase();

  // Look up the user first
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username.toLowerCase())).limit(1);

  if (user == null) {
    return null;
  }

  // Check if slug matches a group
  const [group] = await db
    .select()
    .from(linkGroupsTable)
    .where(
      and(
        eq(linkGroupsTable.userId, user.id),
        eq(linkGroupsTable.slug, normalizedSlug),
        eq(linkGroupsTable.visible, true),
      ),
    )
    .limit(1);

  if (group != null) {
    return { group, type: "group" as const, user };
  }

  // Check if slug matches a link
  const [link] = await db
    .select({
      id: linksTable.id,
      url: linksTable.url,
      userId: linksTable.userId,
      visible: linksTable.visible,
    })
    .from(linksTable)
    .where(and(eq(linksTable.userId, user.id), eq(linksTable.slug, normalizedSlug)))
    .limit(1);

  if (link != null) {
    return { link, type: "link" as const, user };
  }

  return { type: "not_found" as const, user };
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, username } = await props.params;
  const result = await resolveSlug(username, slug);

  if (result == null || result.type !== "group") {
    return { title: "Not Found" };
  }

  const { group, user } = result;
  const name = user.displayName ?? user.username;
  const pageUrl =
    user.customDomain != null && user.customDomainVerified
      ? `https://${user.customDomain}/${group.slug}`
      : `https://anchr.to/${user.username}/${group.slug}`;

  return {
    description: `${group.title} — ${name}'s links on Anchr.`,
    openGraph: {
      description: `${group.title} — ${name}'s links on Anchr.`,
      title: `${group.title} — ${name} (@${user.username})`,
      type: "profile",
      url: pageUrl,
    },
    title: `${group.title} — ${name} (@${user.username})`,
    twitter: {
      card: "summary_large_image",
      description: `${group.title} — ${name}'s links on Anchr.`,
      title: `${group.title} — ${name} (@${user.username})`,
    },
  };
}

type SlugPageProps = {
  params: Promise<Params>;
};

const SlugPage: React.FC<SlugPageProps> = async (props) => {
  const { slug, username } = await props.params;
  const result = await resolveSlug(username, slug);

  // User not found
  if (result == null) {
    notFound();
  }

  // ─── Link redirect ────────────────────────────────────────────────────────
  if (result.type === "link") {
    const { link } = result;

    if (!link.visible) {
      redirect(`/${username}`);
    }

    const headerList = await headers();

    after(() => {
      // Determine click source: if the referrer matches the user's profile page, it's a profile click
      const referrer = headerList.get("referer") ?? null;
      const customDomainHeader = headerList.get("x-custom-domain");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://anchr.to";
      const profilePatterns = [`${appUrl}/${username}`, `anchr.to/${username}`];
      if (customDomainHeader != null) {
        profilePatterns.push(customDomainHeader);
      }
      const source =
        referrer != null && profilePatterns.some((pattern) => referrer.includes(pattern)) ? "profile" : "direct";

      return recordClick(headerList, { linkId: link.id, source, userId: link.userId });
    });

    redirect(link.url);
  }

  // ─── Not found → redirect to profile ──────────────────────────────────────
  if (result.type === "not_found") {
    redirect(`/${username}`);
  }

  // ─── Group sub-page ───────────────────────────────────────────────────────
  const allLinksLabel = "← All links";
  const { group, user } = result;
  const darkThemeId: ThemeId = isValidThemeId(user.pageDarkTheme) ? user.pageDarkTheme : "dark-depths";
  const lightThemeId: ThemeId = isValidThemeId(user.pageLightTheme) ? user.pageLightTheme : "stateroom";

  const headerList = await headers();
  const customDomain = headerList.get("x-custom-domain");
  const basePath = customDomain != null ? "" : `/${user.username}`;

  const profileUrl =
    user.customDomain != null && user.customDomainVerified
      ? `https://${user.customDomain}`
      : `https://anchr.to/${user.username}`;
  const groupUrl =
    user.customDomain != null && user.customDomainVerified
      ? `https://${user.customDomain}/${group.slug}`
      : `https://anchr.to/${user.username}/${group.slug}`;

  // Fetch links in this group
  const groupLinks = await db
    .select({
      copyValue: linksTable.copyValue,
      icon: linksTable.icon,
      id: linksTable.id,
      platform: linksTable.platform,
      slug: linksTable.slug,
      title: linksTable.title,
      url: linksTable.url,
    })
    .from(linksTable)
    .where(and(eq(linksTable.userId, user.id), eq(linksTable.groupId, group.id), eq(linksTable.visible, true)))
    .orderBy(asc(linksTable.position));

  const groupJsonLd = buildGroupJsonLd({
    groupLinks,
    groupTitle: group.title,
    groupUrl,
    profileUrl,
  });

  return (
    <ThemeProvider darkThemeId={darkThemeId} lightThemeId={lightThemeId}>
      <JsonLd data={groupJsonLd} />
      {/* Hairline accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,color-mix(in_srgb,var(--anc-theme-hairline)_60%,transparent),transparent)]" />

      {/* Radial glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-[var(--anc-theme-glow-bg)] opacity-25 blur-3xl" />

      {/* Wave texture */}
      <svg
        className="lp-wave-mask pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern height="22" id="lpWaves" patternUnits="userSpaceOnUse" width="280" x="0" y="0">
            <path
              d="M-70,11 C-52.5,4 -17.5,18 0,11 C17.5,4 52.5,18 70,11 C87.5,4 122.5,18 140,11 C157.5,4 192.5,18 210,11 C227.5,4 262.5,18 280,11 C297.5,4 332.5,18 350,11"
              fill="none"
              opacity="0.18"
              stroke="var(--anc-theme-anchor-color)"
              strokeWidth="0.75"
            />
          </pattern>
        </defs>
        <rect fill="url(#lpWaves)" height="100%" width="100%" />
      </svg>

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-6 px-5 pt-10">
        <ProfileHeader
          avatarUrl={user.avatarUrl}
          basePath={basePath}
          bio={user.bio}
          displayName={user.displayName}
          username={user.username}
        />

        {/* Group title */}
        <h2 className="text-anc-theme-link-text text-center text-sm font-semibold">{group.title}</h2>

        <LinkList basePath={basePath} links={groupLinks} username={user.username} />

        {/* Back to all links */}
        <a
          className="text-anc-theme-link-text hover:text-anc-theme-name text-sm underline underline-offset-4 transition-colors"
          href={basePath.length > 0 ? basePath : "/"}
        >
          {allLinksLabel}
        </a>
      </div>
      <Container className="relative pb-8">
        <Footer hideBranding={isProUser(user) && user.hideBranding} themeToggle={<LinkPageThemeToggle />} />
      </Container>
    </ThemeProvider>
  );
};

export default SlugPage;
