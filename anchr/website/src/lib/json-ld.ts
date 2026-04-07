import { SAME_AS_PLATFORMS } from "@/lib/platforms";

type JsonValue = null | JsonValue[] | boolean | number | string | { [key: string]: JsonValue };

type LinkData = {
  platform: null | string;
  title: string;
  url: string;
};

type LinkGroup = {
  links: LinkData[];
  slug: null | string;
  title: string;
};

type ProfileJsonLdInput = {
  featuredLink: null | LinkData;
  groups: LinkGroup[];
  links: LinkData[];
  pageUrl: string;
  quickLinks: LinkData[];
  user: {
    avatarUrl: null | string;
    bio: null | string;
    displayName: null | string;
    username: string;
  };
};

type JsonLdGraph = {
  "@context": string;
  "@graph": Record<string, JsonValue>[];
};

/**
 * Build the `@graph` JSON-LD for a public profile page.
 *
 * Contains a `ProfilePage` with enriched `Person` mainEntity and an `ItemList`
 * of all visible links in visual order (featured → quick links → ungrouped → grouped).
 */
export function buildProfileJsonLd(input: ProfileJsonLdInput): JsonLdGraph {
  const { featuredLink, groups, links, pageUrl, quickLinks, user } = input;

  // Build sameAs from identity-platform links across all visible links
  const allLinks = [
    ...(featuredLink != null ? [featuredLink] : []),
    ...quickLinks,
    ...links,
    ...groups.flatMap((g) => g.links),
  ];

  const sameAs = allLinks
    .filter((link) => link.platform != null && SAME_AS_PLATFORMS.has(link.platform as never))
    .map((link) => link.url);

  // Build Person entity
  const person: Record<string, JsonValue> = {
    "@type": "Person",
    alternateName: `@${user.username}`,
    name: user.displayName ?? user.username,
    url: pageUrl,
  };

  if (user.bio != null) {
    person.description = user.bio;
  }
  if (user.avatarUrl != null) {
    person.image = user.avatarUrl;
  }
  if (sameAs.length > 0) {
    person.sameAs = sameAs;
  }

  // Build ProfilePage
  const profilePage: Record<string, JsonValue> = {
    "@type": "ProfilePage",
    mainEntity: person,
  };

  if (featuredLink != null) {
    profilePage.significantLink = featuredLink.url;
  }

  // Build ItemList in visual order: featured → quick links → ungrouped → grouped
  const itemListElements: Record<string, JsonValue>[] = [];
  let position = 1;

  // Featured link
  if (featuredLink != null) {
    itemListElements.push({
      "@type": "ListItem",
      name: featuredLink.title,
      position: position++,
      url: featuredLink.url,
    });
  }

  // Quick links
  for (const link of quickLinks) {
    itemListElements.push({
      "@type": "ListItem",
      name: link.title,
      position: position++,
      url: link.url,
    });
  }

  // Ungrouped links
  for (const link of links) {
    itemListElements.push({
      "@type": "ListItem",
      name: link.title,
      position: position++,
      url: link.url,
    });
  }

  // Grouped links
  for (const group of groups) {
    const groupUrl = group.slug != null ? `${pageUrl}/${group.slug}` : undefined;

    for (const link of group.links) {
      const item: Record<string, JsonValue> = {
        "@type": "ListItem",
        name: link.title,
        position: position++,
        url: link.url,
      };

      if (groupUrl != null) {
        item.isPartOf = {
          "@type": "CollectionPage",
          name: group.title,
          url: groupUrl,
        };
      }

      itemListElements.push(item);
    }
  }

  const itemList: Record<string, JsonValue> = {
    "@type": "ItemList",
    itemListElement: itemListElements,
    numberOfItems: itemListElements.length,
  };

  return {
    "@context": "https://schema.org",
    "@graph": [profilePage, itemList],
  };
}

type GroupJsonLdInput = {
  groupLinks: LinkData[];
  groupTitle: string;
  groupUrl: string;
  profileUrl: string;
};

/**
 * Build the `@graph` JSON-LD for a group sub-page.
 *
 * Contains a `CollectionPage` linked to the parent `ProfilePage` and an `ItemList`
 * of all links in the group.
 */
export function buildGroupJsonLd(input: GroupJsonLdInput): JsonLdGraph {
  const { groupLinks, groupTitle, groupUrl, profileUrl } = input;

  const collectionPage: Record<string, JsonValue> = {
    "@type": "CollectionPage",
    isPartOf: {
      "@type": "ProfilePage",
      url: profileUrl,
    },
    name: groupTitle,
    url: groupUrl,
  };

  const itemListElements = groupLinks.map((link, index) => ({
    "@type": "ListItem",
    name: link.title,
    position: index + 1,
    url: link.url,
  }));

  const itemList: Record<string, JsonValue> = {
    "@type": "ItemList",
    itemListElement: itemListElements,
    numberOfItems: itemListElements.length,
  };

  return {
    "@context": "https://schema.org",
    "@graph": [collectionPage, itemList],
  };
}
