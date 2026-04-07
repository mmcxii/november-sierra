import { describe, expect, it } from "vitest";
import { buildGroupJsonLd, buildProfileJsonLd } from "./json-ld";

const baseUser = {
  avatarUrl: "https://example.com/avatar.jpg",
  bio: "Designer & developer",
  displayName: "Alice Smith",
  username: "alice",
};

const baseInput = {
  featuredLink: null,
  groups: [],
  links: [],
  pageUrl: "https://anchr.to/alice",
  quickLinks: [],
  user: baseUser,
};

describe("buildProfileJsonLd", () => {
  it("returns @graph with ProfilePage and ItemList", () => {
    //* Act
    const result = buildProfileJsonLd(baseInput);

    //* Assert
    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@graph"]).toHaveLength(2);
    expect(result["@graph"][0]).toMatchObject({ "@type": "ProfilePage" });
    expect(result["@graph"][1]).toMatchObject({ "@type": "ItemList" });
  });

  it("builds Person with name, alternateName, description, image, and url", () => {
    //* Act
    const result = buildProfileJsonLd(baseInput);
    const profilePage = result["@graph"][0] as Record<string, unknown>;
    const person = profilePage.mainEntity as Record<string, unknown>;

    //* Assert
    expect(person).toMatchObject({
      "@type": "Person",
      alternateName: "@alice",
      description: "Designer & developer",
      image: "https://example.com/avatar.jpg",
      name: "Alice Smith",
      url: "https://anchr.to/alice",
    });
  });

  it("omits description when bio is null", () => {
    //* Act
    const result = buildProfileJsonLd({
      ...baseInput,
      user: { ...baseUser, bio: null },
    });
    const profilePage = result["@graph"][0] as Record<string, unknown>;
    const person = profilePage.mainEntity as Record<string, unknown>;

    //* Assert
    expect(person).not.toHaveProperty("description");
  });

  it("omits image when avatarUrl is null", () => {
    //* Act
    const result = buildProfileJsonLd({
      ...baseInput,
      user: { ...baseUser, avatarUrl: null },
    });
    const profilePage = result["@graph"][0] as Record<string, unknown>;
    const person = profilePage.mainEntity as Record<string, unknown>;

    //* Assert
    expect(person).not.toHaveProperty("image");
  });

  it("falls back to username when displayName is null", () => {
    //* Act
    const result = buildProfileJsonLd({
      ...baseInput,
      user: { ...baseUser, displayName: null },
    });
    const profilePage = result["@graph"][0] as Record<string, unknown>;
    const person = profilePage.mainEntity as Record<string, unknown>;

    //* Assert
    expect(person).toHaveProperty("name", "alice");
  });

  it("produces empty ItemList when there are no links", () => {
    //* Act
    const result = buildProfileJsonLd(baseInput);
    const itemList = result["@graph"][1] as Record<string, unknown>;

    //* Assert
    expect(itemList).toMatchObject({
      "@type": "ItemList",
      itemListElement: [],
      numberOfItems: 0,
    });
  });

  it("populates sameAs with identity platform URLs only", () => {
    //* Act
    const result = buildProfileJsonLd({
      ...baseInput,
      links: [
        { platform: "github", title: "GitHub", url: "https://github.com/alice" },
        { platform: "x", title: "X", url: "https://x.com/alice" },
        { platform: "paypal", title: "PayPal", url: "https://paypal.me/alice" },
        { platform: "venmo", title: "Venmo", url: "https://venmo.com/alice" },
        { platform: null, title: "My Site", url: "https://example.com" },
      ],
    });
    const profilePage = result["@graph"][0] as Record<string, unknown>;
    const person = profilePage.mainEntity as Record<string, unknown>;

    //* Assert
    expect(person.sameAs).toEqual(["https://github.com/alice", "https://x.com/alice"]);
  });

  it("omits sameAs when only payment platforms are present", () => {
    //* Act
    const result = buildProfileJsonLd({
      ...baseInput,
      links: [
        { platform: "paypal", title: "PayPal", url: "https://paypal.me/alice" },
        { platform: "bitcoin", title: "BTC", url: "bitcoin:1abc" },
      ],
    });
    const profilePage = result["@graph"][0] as Record<string, unknown>;
    const person = profilePage.mainEntity as Record<string, unknown>;

    //* Assert
    expect(person).not.toHaveProperty("sameAs");
  });

  it("includes all identity platforms in sameAs", () => {
    //* Act
    const identityLinks = [
      { platform: "github", title: "GitHub", url: "https://github.com/alice" },
      { platform: "x", title: "X", url: "https://x.com/alice" },
      { platform: "instagram", title: "IG", url: "https://instagram.com/alice" },
      { platform: "linkedin", title: "LI", url: "https://linkedin.com/in/alice" },
      { platform: "youtube", title: "YT", url: "https://youtube.com/@alice" },
      { platform: "tiktok", title: "TT", url: "https://tiktok.com/@alice" },
      { platform: "twitch", title: "Twitch", url: "https://twitch.tv/alice" },
      { platform: "nostr", title: "Nostr", url: "https://primal.net/p/npub1abc" },
    ];
    const result = buildProfileJsonLd({ ...baseInput, links: identityLinks });
    const profilePage = result["@graph"][0] as Record<string, unknown>;
    const person = profilePage.mainEntity as Record<string, unknown>;

    //* Assert
    expect(person.sameAs).toHaveLength(8);
  });

  it("adds significantLink when featured link is present", () => {
    //* Act
    const result = buildProfileJsonLd({
      ...baseInput,
      featuredLink: { platform: null, title: "Featured", url: "https://example.com/featured" },
    });
    const profilePage = result["@graph"][0] as Record<string, unknown>;

    //* Assert
    expect(profilePage.significantLink).toBe("https://example.com/featured");
  });

  it("omits significantLink when no featured link", () => {
    //* Act
    const result = buildProfileJsonLd(baseInput);
    const profilePage = result["@graph"][0] as Record<string, unknown>;

    //* Assert
    expect(profilePage).not.toHaveProperty("significantLink");
  });

  it("orders ItemList as featured → quick links → ungrouped → grouped", () => {
    //* Act
    const result = buildProfileJsonLd({
      ...baseInput,
      featuredLink: { platform: null, title: "Featured", url: "https://example.com/featured" },
      groups: [
        {
          links: [{ platform: null, title: "Grouped Link", url: "https://example.com/grouped" }],
          slug: "projects",
          title: "Projects",
        },
      ],
      links: [{ platform: null, title: "Ungrouped Link", url: "https://example.com/ungrouped" }],
      quickLinks: [{ platform: "github", title: "GitHub", url: "https://github.com/alice" }],
    });
    const itemList = result["@graph"][1] as Record<string, unknown>;
    const items = itemList.itemListElement as Record<string, unknown>[];

    //* Assert
    expect(items).toHaveLength(4);
    expect(items[0]).toMatchObject({ name: "Featured", position: 1 });
    expect(items[1]).toMatchObject({ name: "GitHub", position: 2 });
    expect(items[2]).toMatchObject({ name: "Ungrouped Link", position: 3 });
    expect(items[3]).toMatchObject({ name: "Grouped Link", position: 4 });
  });

  it("adds isPartOf with CollectionPage to grouped links with slugs", () => {
    //* Act
    const result = buildProfileJsonLd({
      ...baseInput,
      groups: [
        {
          links: [{ platform: null, title: "Project A", url: "https://example.com/a" }],
          slug: "projects",
          title: "Projects",
        },
      ],
    });
    const itemList = result["@graph"][1] as Record<string, unknown>;
    const items = itemList.itemListElement as Record<string, unknown>[];

    //* Assert
    expect(items[0]).toMatchObject({
      isPartOf: {
        "@type": "CollectionPage",
        name: "Projects",
        url: "https://anchr.to/alice/projects",
      },
    });
  });

  it("omits isPartOf for grouped links without slugs", () => {
    //* Act
    const result = buildProfileJsonLd({
      ...baseInput,
      groups: [
        {
          links: [{ platform: null, title: "Link", url: "https://example.com" }],
          slug: null,
          title: "No Slug Group",
        },
      ],
    });
    const itemList = result["@graph"][1] as Record<string, unknown>;
    const items = itemList.itemListElement as Record<string, unknown>[];

    //* Assert
    expect(items[0]).not.toHaveProperty("isPartOf");
  });

  it("includes quick links in ItemList", () => {
    //* Act
    const result = buildProfileJsonLd({
      ...baseInput,
      quickLinks: [
        { platform: "github", title: "GitHub", url: "https://github.com/alice" },
        { platform: "x", title: "X", url: "https://x.com/alice" },
      ],
    });
    const itemList = result["@graph"][1] as Record<string, unknown>;
    const items = itemList.itemListElement as Record<string, unknown>[];

    //* Assert
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ name: "GitHub", position: 1, url: "https://github.com/alice" });
    expect(items[1]).toMatchObject({ name: "X", position: 2, url: "https://x.com/alice" });
  });

  it("handles mixed grouped and ungrouped links correctly", () => {
    //* Act
    const result = buildProfileJsonLd({
      ...baseInput,
      groups: [
        {
          links: [
            { platform: null, title: "G1 Link", url: "https://example.com/g1" },
            { platform: null, title: "G1 Link 2", url: "https://example.com/g1-2" },
          ],
          slug: "group-one",
          title: "Group One",
        },
        {
          links: [{ platform: null, title: "G2 Link", url: "https://example.com/g2" }],
          slug: "group-two",
          title: "Group Two",
        },
      ],
      links: [
        { platform: null, title: "Solo 1", url: "https://example.com/solo1" },
        { platform: null, title: "Solo 2", url: "https://example.com/solo2" },
      ],
    });
    const itemList = result["@graph"][1] as Record<string, unknown>;
    const items = itemList.itemListElement as Record<string, unknown>[];

    //* Assert
    expect(itemList.numberOfItems).toBe(5);
    // Ungrouped first
    expect(items[0]).toMatchObject({ name: "Solo 1", position: 1 });
    expect(items[1]).toMatchObject({ name: "Solo 2", position: 2 });
    // Then grouped
    expect(items[2]).toMatchObject({ name: "G1 Link", position: 3 });
    expect(items[2]).toHaveProperty("isPartOf");
    expect(items[3]).toMatchObject({ name: "G1 Link 2", position: 4 });
    expect(items[4]).toMatchObject({ name: "G2 Link", position: 5 });
    expect(items[4]).toHaveProperty("isPartOf");
  });
});

describe("buildGroupJsonLd", () => {
  it("returns @graph with CollectionPage and ItemList", () => {
    //* Act
    const result = buildGroupJsonLd({
      groupLinks: [{ platform: null, title: "Link 1", url: "https://example.com/1" }],
      groupTitle: "Projects",
      groupUrl: "https://anchr.to/alice/projects",
      profileUrl: "https://anchr.to/alice",
    });

    //* Assert
    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@graph"]).toHaveLength(2);
    expect(result["@graph"][0]).toMatchObject({
      "@type": "CollectionPage",
      isPartOf: { "@type": "ProfilePage", url: "https://anchr.to/alice" },
      name: "Projects",
      url: "https://anchr.to/alice/projects",
    });
    expect(result["@graph"][1]).toMatchObject({
      "@type": "ItemList",
      itemListElement: [{ "@type": "ListItem", name: "Link 1", position: 1, url: "https://example.com/1" }],
      numberOfItems: 1,
    });
  });

  it("produces empty ItemList when group has no links", () => {
    //* Act
    const result = buildGroupJsonLd({
      groupLinks: [],
      groupTitle: "Empty Group",
      groupUrl: "https://anchr.to/alice/empty",
      profileUrl: "https://anchr.to/alice",
    });
    const itemList = result["@graph"][1] as Record<string, unknown>;

    //* Assert
    expect(itemList).toMatchObject({
      "@type": "ItemList",
      itemListElement: [],
      numberOfItems: 0,
    });
  });

  it("assigns sequential positions to group links", () => {
    //* Act
    const result = buildGroupJsonLd({
      groupLinks: [
        { platform: null, title: "A", url: "https://example.com/a" },
        { platform: null, title: "B", url: "https://example.com/b" },
        { platform: null, title: "C", url: "https://example.com/c" },
      ],
      groupTitle: "Projects",
      groupUrl: "https://anchr.to/alice/projects",
      profileUrl: "https://anchr.to/alice",
    });
    const itemList = result["@graph"][1] as Record<string, unknown>;
    const items = itemList.itemListElement as Record<string, unknown>[];

    //* Assert
    expect(items[0]).toMatchObject({ position: 1 });
    expect(items[1]).toMatchObject({ position: 2 });
    expect(items[2]).toMatchObject({ position: 3 });
  });
});
