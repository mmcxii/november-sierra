import { JsonLd } from "@/components/json-ld";
import { Footer } from "@/components/link-page/footer";
import { LinkList } from "@/components/link-page/link-list";
import { ProfileHeader } from "@/components/link-page/profile-header";
import { ThemeProvider, type CustomThemeRenderData } from "@/components/link-page/theme-provider";
import { LinkPageThemeToggle } from "@/components/link-page/theme-toggle";
import { Container } from "@/components/ui/container";
import type { ThemeVariables } from "@/lib/custom-themes";
import { db } from "@/lib/db/client";
import { customThemesTable } from "@/lib/db/schema/custom-theme";
import { linksTable } from "@/lib/db/schema/link";
import { linkGroupsTable } from "@/lib/db/schema/link-group";
import { usersTable } from "@/lib/db/schema/user";
import { buildProfileJsonLd } from "@/lib/json-ld";
import { refreshNostrProfile } from "@/lib/nostr-profile.server";
import { isValidThemeId } from "@/lib/themes";
import { isProUser } from "@/lib/tier";
import { isCustomThemeId } from "@/lib/utils/custom-theme";
import { and, asc, eq, isNull } from "drizzle-orm";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import * as React from "react";

export const revalidate = 0;
export const dynamicParams = true;

type Params = { username: string };

function getUserPageUrl(user: { customDomain: null | string; customDomainVerified: boolean; username: string }) {
  return user.customDomain != null && user.customDomainVerified
    ? `https://${user.customDomain}`
    : `https://anchr.to/${user.username}`;
}

async function getPageData(username: string) {
  const users = await db.select().from(usersTable).where(eq(usersTable.username, username.toLowerCase())).limit(1);

  const user = users[0];

  if (user == null) {
    return null;
  }

  // Fire-and-forget Nostr profile refresh if stale (>24h)
  if (
    user.useNostrProfile &&
    user.nostrNpub != null &&
    (user.nostrProfileFetchedAt == null || Date.now() - user.nostrProfileFetchedAt.getTime() > 24 * 60 * 60 * 1000)
  ) {
    void refreshNostrProfile(user);
  }

  // Fetch Quick Links group (Pro only)
  let quickLinks: {
    copyValue: null | string;
    icon: null | string;
    id: string;
    platform: null | string;
    slug: string;
    title: string;
    url: string;
  }[] = [];

  if (isProUser(user)) {
    const [quickLinksGroup] = await db
      .select({ id: linkGroupsTable.id })
      .from(linkGroupsTable)
      .where(
        and(
          eq(linkGroupsTable.userId, user.id),
          eq(linkGroupsTable.isQuickLinks, true),
          eq(linkGroupsTable.visible, true),
        ),
      )
      .limit(1);

    if (quickLinksGroup != null) {
      quickLinks = await db
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
        .where(
          and(eq(linksTable.userId, user.id), eq(linksTable.visible, true), eq(linksTable.groupId, quickLinksGroup.id)),
        )
        .orderBy(asc(linksTable.position));
    }
  }

  // Fetch featured link (Pro only)
  let featuredLink: null | {
    copyValue: null | string;
    icon: null | string;
    id: string;
    platform: null | string;
    slug: string;
    title: string;
    url: string;
  } = null;

  if (isProUser(user)) {
    const [found] = await db
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
      .where(and(eq(linksTable.userId, user.id), eq(linksTable.visible, true), eq(linksTable.isFeatured, true)))
      .limit(1);

    featuredLink = found ?? null;
  }

  // Fetch ungrouped visible links (excluding featured)
  const ungroupedLinks = await db
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
    .where(
      and(
        eq(linksTable.userId, user.id),
        eq(linksTable.visible, true),
        isNull(linksTable.groupId),
        eq(linksTable.isFeatured, false),
      ),
    )
    .orderBy(asc(linksTable.position));

  // Fetch visible groups (excluding Quick Links)
  const visibleGroups = await db
    .select()
    .from(linkGroupsTable)
    .where(
      and(
        eq(linkGroupsTable.userId, user.id),
        eq(linkGroupsTable.visible, true),
        eq(linkGroupsTable.isQuickLinks, false),
      ),
    )
    .orderBy(asc(linkGroupsTable.position));

  // Fetch grouped visible links (excluding featured)
  const groupedLinks =
    visibleGroups.length > 0
      ? await db
          .select({
            copyValue: linksTable.copyValue,
            groupId: linksTable.groupId,
            icon: linksTable.icon,
            id: linksTable.id,
            platform: linksTable.platform,
            slug: linksTable.slug,
            title: linksTable.title,
            url: linksTable.url,
          })
          .from(linksTable)
          .where(and(eq(linksTable.userId, user.id), eq(linksTable.visible, true), eq(linksTable.isFeatured, false)))
          .orderBy(asc(linksTable.position))
      : [];

  const groups = visibleGroups.map((group) => ({
    id: group.id,
    links: groupedLinks.filter((l) => l.groupId === group.id),
    slug: group.slug,
    title: group.title,
  }));

  return { featuredLink, groups, links: ungroupedLinks, quickLinks, user };
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const { username } = await props.params;
  const data = await getPageData(username);

  if (data == null) {
    return { title: "Not Found" };
  }

  const { user } = data;
  const name = user.displayName ?? user.username;
  const pageUrl = getUserPageUrl(user);

  return {
    description: user.bio ?? `Check out ${name}'s links on Anchr.`,
    openGraph: {
      description: user.bio ?? `Check out ${name}'s links on Anchr.`,
      title: `${name} (@${user.username})`,
      type: "profile",
      url: pageUrl,
    },
    title: `${name} (@${user.username})`,
    twitter: {
      card: "summary_large_image",
      description: user.bio ?? `Check out ${name}'s links on Anchr.`,
      title: `${name} (@${user.username})`,
    },
  };
}

export type UserPageProps = {
  params: Promise<Params>;
};

const UserPage: React.FC<UserPageProps> = async (props) => {
  const { params } = props;

  //* Variables
  await connection();
  const { username } = await params;
  const data = await getPageData(username);

  if (data == null) {
    notFound();
  }

  const { featuredLink, groups, links, quickLinks, user } = data;
  const darkThemeId = isValidThemeId(user.pageDarkTheme) ? user.pageDarkTheme : "dark-depths";
  const lightThemeId = isValidThemeId(user.pageLightTheme) ? user.pageLightTheme : "stateroom";

  // Resolve custom themes if assigned
  let darkCustomTheme: undefined | CustomThemeRenderData;
  let lightCustomTheme: undefined | CustomThemeRenderData;

  if (isCustomThemeId(user.pageDarkTheme)) {
    const [ct] = await db.select().from(customThemesTable).where(eq(customThemesTable.id, user.pageDarkTheme)).limit(1);
    if (ct != null) {
      darkCustomTheme = {
        backgroundImage: ct.backgroundImage,
        borderRadius: ct.borderRadius,
        font: ct.font,
        isDark: true,
        overlayColor: ct.overlayColor,
        overlayOpacity: ct.overlayOpacity,
        rawCss: ct.rawCss,
        variables: ct.variables as ThemeVariables,
      };
    }
  }

  if (isCustomThemeId(user.pageLightTheme)) {
    const [ct] = await db
      .select()
      .from(customThemesTable)
      .where(eq(customThemesTable.id, user.pageLightTheme))
      .limit(1);
    if (ct != null) {
      lightCustomTheme = {
        backgroundImage: ct.backgroundImage,
        borderRadius: ct.borderRadius,
        font: ct.font,
        isDark: false,
        overlayColor: ct.overlayColor,
        overlayOpacity: ct.overlayOpacity,
        rawCss: ct.rawCss,
        variables: ct.variables as ThemeVariables,
      };
    }
  }

  const showThemeToggle = user.pageLightEnabled && user.pageDarkEnabled;

  const headerList = await headers();
  const customDomain = headerList.get("x-custom-domain");
  const basePath = customDomain != null ? "" : `/${user.username}`;

  const pageUrl = getUserPageUrl(user);

  const profileJsonLd = buildProfileJsonLd({
    featuredLink,
    groups,
    links,
    pageUrl,
    quickLinks,
    user,
  });

  return (
    <ThemeProvider
      darkCustomTheme={darkCustomTheme}
      darkEnabled={user.pageDarkEnabled}
      darkThemeId={darkCustomTheme != null ? "custom" : darkThemeId}
      lightCustomTheme={lightCustomTheme}
      lightEnabled={user.pageLightEnabled}
      lightThemeId={lightCustomTheme != null ? "custom" : lightThemeId}
    >
      <JsonLd data={profileJsonLd} />
      {/* Hairline accent */}
      <div className="anchr-hairline absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,color-mix(in_srgb,var(--anc-theme-hairline)_60%,transparent),transparent)]" />

      {/* Radial glow */}
      <div className="anchr-glow pointer-events-none absolute top-0 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-[var(--anc-theme-glow-bg)] opacity-25 blur-3xl" />

      {/* Wave texture */}
      <svg
        className="anchr-wave pointer-events-none absolute inset-0 h-full w-full"
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
          quickLinks={quickLinks}
          username={user.username}
        />
        <LinkList
          basePath={basePath}
          featuredLink={featuredLink}
          groups={groups}
          links={links}
          username={user.username}
        />
      </div>
      <Container className="relative pb-8">
        <Footer
          hideBranding={isProUser(user) && user.hideBranding}
          themeToggle={showThemeToggle ? <LinkPageThemeToggle /> : null}
        />
      </Container>
    </ThemeProvider>
  );
};

export default UserPage;
