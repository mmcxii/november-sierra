import { API_ERROR_CODES } from "@/lib/api/errors";
import { db } from "@/lib/db/client";
import { linksTable } from "@/lib/db/schema/link";
import { linkGroupsTable } from "@/lib/db/schema/link-group";
import { usersTable } from "@/lib/db/schema/user";
import { envSchema } from "@/lib/env";
import { isProUser } from "@/lib/tier";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { serviceError, serviceSuccess, type ServiceResult } from "./types";

type PublicLink = {
  id: string;
  platform: null | string;
  position: number;
  slug: string;
  title: string;
  url: string;
  visible: boolean;
};

type PublicGroup = {
  groupUrl: null | string;
  links: PublicLink[];
  name: string;
  slug: null | string;
};

export type PublicProfileResponse = {
  avatarUrl: null | string;
  bio: null | string;
  displayName: null | string;
  groups: PublicGroup[];
  links: PublicLink[];
  profileUrl: string;
  username: string;
};

export async function lookupProfile(username: string): Promise<ServiceResult<PublicProfileResponse>> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username.toLowerCase())).limit(1);

  if (user == null) {
    return serviceError(API_ERROR_CODES.NOT_FOUND, "User not found.", 404);
  }

  const baseUrl = envSchema.NEXT_PUBLIC_APP_URL;
  const profileUrl =
    user.customDomain != null && user.customDomainVerified
      ? `https://${user.customDomain}`
      : `${baseUrl}/${user.username}`;

  // Fetch visible ungrouped links
  const ungroupedLinks = await db
    .select({
      id: linksTable.id,
      platform: linksTable.platform,
      position: linksTable.position,
      slug: linksTable.slug,
      title: linksTable.title,
      url: linksTable.url,
      visible: linksTable.visible,
    })
    .from(linksTable)
    .where(and(eq(linksTable.userId, user.id), eq(linksTable.visible, true), isNull(linksTable.groupId)))
    .orderBy(asc(linksTable.position));

  // Fetch visible groups (excluding Quick Links) and their links
  const groups = [];

  if (isProUser(user)) {
    const visibleGroups = await db
      .select({
        id: linkGroupsTable.id,
        slug: linkGroupsTable.slug,
        title: linkGroupsTable.title,
      })
      .from(linkGroupsTable)
      .where(
        and(
          eq(linkGroupsTable.userId, user.id),
          eq(linkGroupsTable.visible, true),
          eq(linkGroupsTable.isQuickLinks, false),
        ),
      )
      .orderBy(asc(linkGroupsTable.position));

    if (visibleGroups.length > 0) {
      const groupIds = visibleGroups.map((g) => g.id);

      const allGroupLinks = await db
        .select({
          groupId: linksTable.groupId,
          id: linksTable.id,
          platform: linksTable.platform,
          position: linksTable.position,
          slug: linksTable.slug,
          title: linksTable.title,
          url: linksTable.url,
          visible: linksTable.visible,
        })
        .from(linksTable)
        .where(and(eq(linksTable.userId, user.id), eq(linksTable.visible, true), inArray(linksTable.groupId, groupIds)))
        .orderBy(asc(linksTable.position));

      const linksByGroup = new Map<string, typeof allGroupLinks>();
      for (const link of allGroupLinks) {
        if (link.groupId == null) {
          continue;
        }
        const existing = linksByGroup.get(link.groupId) ?? [];
        existing.push(link);
        linksByGroup.set(link.groupId, existing);
      }

      for (const group of visibleGroups) {
        groups.push({
          groupUrl: group.slug != null ? `${profileUrl}/${group.slug}` : null,
          links: linksByGroup.get(group.id) ?? [],
          name: group.title,
          slug: group.slug,
        });
      }
    }
  }

  return serviceSuccess({
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    displayName: user.displayName,
    groups,
    links: ungroupedLinks,
    profileUrl,
    username: user.username,
  });
}
