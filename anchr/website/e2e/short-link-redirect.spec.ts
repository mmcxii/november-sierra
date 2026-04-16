import { expect, test } from "./fixtures/auth";
import {
  countClicksForLink,
  countClicksForShortLink,
  deleteBioLinkWithShortSlug,
  deleteShortLinkFixture,
  getLatestClickForLink,
  getLatestClickForShortLink,
  getUserIdByUsername,
  insertBioLinkWithShortSlug,
  insertShortLinkFixture,
  setUserShortDomain,
  tombstoneShortSlug,
} from "./fixtures/db";
import { testDomain, testUsers } from "./fixtures/test-users";

/**
 * These tests exercise the short-URL redirect flow end-to-end, which the CRUD
 * spec does not cover. They hit localhost with a spoofed Host header so the
 * middleware treats the request as the configured short domain (anch.to) or a
 * user-configured custom short domain, rewrites to /r/[slug], and the page
 * component either redirects to the destination, the /unlock page, or the app
 * root depending on the short link's state.
 *
 * Short-circuits insertShortLinkFixture (bypasses the urlResolves HEAD probe
 * in createShortLinkAction) because we're testing the redirect, not creation.
 */

const SHORT_DOMAIN_HOST = "anch.to";
const APP_URL = "http://localhost:3000";

// Unique slug per test so parallel execution doesn't trample state.
function runScopedSlug(label: string): string {
  const runId = process.env.E2E_RUN_ID ?? "local";
  const safe =
    runId
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(-5) || "x";
  return `${label}${safe}`.slice(0, 12);
}

test.describe("short-link redirect", () => {
  // Tests share the pro seed user (seeded once per CI run); the custom-domain
  // test mutates users.short_domain, so we serialize to avoid Host-header races.
  test.describe.configure({ mode: "serial" });

  test("short domain redirects to destination URL", async ({ request }) => {
    //* Arrange
    const userId = await getUserIdByUsername(testUsers.pro.username);
    if (userId == null) {
      throw new Error("pro user not found — seed script should have created it");
    }
    const slug = runScopedSlug("rda");
    await insertShortLinkFixture({ destinationUrl: testDomain.url, slug, userId });

    try {
      //* Act
      const response = await request.get(`${APP_URL}/${slug}`, {
        headers: { Host: SHORT_DOMAIN_HOST },
        maxRedirects: 0,
      });

      //* Assert
      expect(response.status()).toBeGreaterThanOrEqual(300);
      expect(response.status()).toBeLessThan(400);
      expect(response.headers().location).toBe(testDomain.url);
    } finally {
      await deleteShortLinkFixture(slug);
    }
  });

  test("expired short link redirects to app root", async ({ request }) => {
    //* Arrange
    const userId = await getUserIdByUsername(testUsers.pro.username);
    if (userId == null) {
      throw new Error("pro user not found");
    }
    const slug = runScopedSlug("exp");
    await insertShortLinkFixture({
      destinationUrl: testDomain.url,
      expiresAt: new Date(Date.now() - 60_000),
      slug,
      userId,
    });

    try {
      //* Act
      const response = await request.get(`${APP_URL}/${slug}`, {
        headers: { Host: SHORT_DOMAIN_HOST },
        maxRedirects: 0,
      });

      //* Assert — redirect but NOT to destination; landing is the app root.
      expect(response.status()).toBeGreaterThanOrEqual(300);
      expect(response.status()).toBeLessThan(400);
      expect(response.headers().location).not.toBe(testDomain.url);
      expect(response.headers().location).toContain(APP_URL);
    } finally {
      await deleteShortLinkFixture(slug);
    }
  });

  test("tombstoned slug redirects to app root", async ({ request }) => {
    //* Arrange
    const userId = await getUserIdByUsername(testUsers.pro.username);
    if (userId == null) {
      throw new Error("pro user not found");
    }
    const slug = runScopedSlug("tmb");
    await insertShortLinkFixture({ destinationUrl: testDomain.url, slug, userId });
    await tombstoneShortSlug(slug);

    try {
      //* Act
      const response = await request.get(`${APP_URL}/${slug}`, {
        headers: { Host: SHORT_DOMAIN_HOST },
        maxRedirects: 0,
      });

      //* Assert
      expect(response.status()).toBeGreaterThanOrEqual(300);
      expect(response.status()).toBeLessThan(400);
      expect(response.headers().location).not.toBe(testDomain.url);
      expect(response.headers().location).toContain(APP_URL);
    } finally {
      await deleteShortLinkFixture(slug);
    }
  });

  test("unknown slug redirects to app root", async ({ request }) => {
    //* Act
    const response = await request.get(`${APP_URL}/${runScopedSlug("unk")}`, {
      headers: { Host: SHORT_DOMAIN_HOST },
      maxRedirects: 0,
    });

    //* Assert
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers().location).toContain(APP_URL);
  });

  test("password-protected short link redirects to /unlock/<slug>", async ({ request }) => {
    //* Arrange
    const userId = await getUserIdByUsername(testUsers.pro.username);
    if (userId == null) {
      throw new Error("pro user not found");
    }
    const slug = runScopedSlug("pwd");
    // passwordHash can be any non-null string — the redirect branch only
    // checks for presence, not validity. Actual bcrypt verification happens
    // on the /unlock page, which has its own spec coverage (to be added).
    await insertShortLinkFixture({
      destinationUrl: testDomain.url,
      passwordHash: "$2a$10$e2etestpasswordhashplaceholderxxxxxxxxxxxxxxxxxxxxxx",
      slug,
      userId,
    });

    try {
      //* Act
      const response = await request.get(`${APP_URL}/${slug}`, {
        headers: { Host: SHORT_DOMAIN_HOST },
        maxRedirects: 0,
      });

      //* Assert — redirect points at the unlock page on the main app, NOT the
      //  destination URL. This protects against an accidental downgrade of the
      //  password gate to a plain redirect.
      expect(response.status()).toBeGreaterThanOrEqual(300);
      expect(response.status()).toBeLessThan(400);
      expect(response.headers().location).toContain(`/unlock/${slug}`);
      expect(response.headers().location).not.toBe(testDomain.url);
    } finally {
      await deleteShortLinkFixture(slug);
    }
  });

  test("redirect records a click with source=short_url", async ({ request }) => {
    //* Arrange
    const userId = await getUserIdByUsername(testUsers.pro.username);
    if (userId == null) {
      throw new Error("pro user not found");
    }
    const slug = runScopedSlug("clk");
    const shortLinkId = await insertShortLinkFixture({ destinationUrl: testDomain.url, slug, userId });
    const before = await countClicksForShortLink(shortLinkId);

    try {
      //* Act
      const response = await request.get(`${APP_URL}/${slug}`, {
        headers: { Host: SHORT_DOMAIN_HOST },
        maxRedirects: 0,
      });

      //* Assert — click recording runs inside Next.js `after()` so it's fire-
      //  and-forget from the response's perspective. Poll briefly before
      //  asserting the count bumped and the source attribution stuck.
      expect(response.status()).toBeGreaterThanOrEqual(300);
      expect(response.status()).toBeLessThan(400);
      await expect
        .poll(() => countClicksForShortLink(shortLinkId), { intervals: [100, 200, 500, 1000, 2000], timeout: 10_000 })
        .toBe(before + 1);
      const latest = await getLatestClickForShortLink(shortLinkId);
      expect(latest?.source).toBe("short_url");
    } finally {
      await deleteShortLinkFixture(slug);
    }
  });

  test("bio-link slug redirects to bio link URL", async ({ request }) => {
    //* Arrange
    const userId = await getUserIdByUsername(testUsers.pro.username);
    if (userId == null) {
      throw new Error("pro user not found");
    }
    const shortSlug = runScopedSlug("bio");
    const linkSlug = `bio-redirect-${shortSlug}`;
    const linkId = await insertBioLinkWithShortSlug({
      destinationUrl: testDomain.url,
      linkSlug,
      shortSlug,
      title: "Bio Redirect Test",
      userId,
    });

    try {
      //* Act — hit anch.to/<bioSlug>; /r/[slug] takes the type='bio' branch
      //  and resolves to the linkId's URL.
      const response = await request.get(`${APP_URL}/${shortSlug}`, {
        headers: { Host: SHORT_DOMAIN_HOST },
        maxRedirects: 0,
      });

      //* Assert
      expect(response.status()).toBeGreaterThanOrEqual(300);
      expect(response.status()).toBeLessThan(400);
      expect(response.headers().location).toBe(testDomain.url);
    } finally {
      await deleteBioLinkWithShortSlug(linkId, shortSlug);
    }
  });

  test("custom short_domain (user-configured) redirects via Host header", async ({ request }) => {
    //* Arrange
    const userId = await getUserIdByUsername(testUsers.pro.username);
    if (userId == null) {
      throw new Error("pro user not found");
    }
    const slug = runScopedSlug("csd");
    // /r/[slug] resolves custom-short-domain requests by looking up short_links
    // by (userId, customSlug) — not by the auto-generated slug. Seed a customSlug
    // so the middleware → /r/[slug] → customSlug lookup resolves.
    const customSlug = `csd-${slug}`;
    await setUserShortDomain(testUsers.pro.username, testDomain.shortSubdomain);
    await insertShortLinkFixture({ customSlug, destinationUrl: testDomain.url, slug, userId });

    try {
      //* Act — hit localhost with the run-scoped short domain as Host; middleware
      //  resolveShortDomain looks up users.short_domain and rewrites to /r/<customSlug>
      //  with x-short-domain-username, which /r/[slug] uses to scope the lookup.
      const response = await request.get(`${APP_URL}/${customSlug}`, {
        headers: { Host: testDomain.shortSubdomain },
        maxRedirects: 0,
      });

      //* Assert
      expect(response.status()).toBeGreaterThanOrEqual(300);
      expect(response.status()).toBeLessThan(400);
      expect(response.headers().location).toBe(testDomain.url);
    } finally {
      await deleteShortLinkFixture(slug);
      await setUserShortDomain(testUsers.pro.username, null);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Click source attribution for bio-link hits (source=profile / source=direct).
  // These exercise the /[username]/[slug] page path (not /r/[slug]) which
  // decides source from the Referer header — profile if it matches the user's
  // profile URL, direct otherwise. Paired with the existing source=short_url
  // test above, all three attribution branches now have coverage.
  // ──────────────────────────────────────────────────────────────────────────

  test("bio-link click from profile page records source=profile", async ({ request }) => {
    //* Arrange — create a bio link via the DB fixture.
    const userId = await getUserIdByUsername(testUsers.pro.username);
    if (userId == null) {
      throw new Error("pro user not found");
    }
    const shortSlug = runScopedSlug("psrc");
    const linkSlug = `profile-src-${shortSlug}`;
    const linkId = await insertBioLinkWithShortSlug({
      destinationUrl: testDomain.url,
      linkSlug,
      shortSlug,
      title: "Profile Source Test",
      userId,
    });
    const before = await countClicksForLink(linkId);

    try {
      //* Act — spoof the Referer so the server classifies as profile.
      const response = await request.get(`${APP_URL}/${testUsers.pro.username}/${linkSlug}`, {
        headers: { Referer: `${APP_URL}/${testUsers.pro.username}` },
        maxRedirects: 0,
      });

      //* Assert — redirect happened, click row has source=profile.
      expect(response.status()).toBeGreaterThanOrEqual(300);
      expect(response.status()).toBeLessThan(400);
      await expect
        .poll(() => countClicksForLink(linkId), { intervals: [100, 200, 500, 1000, 2000], timeout: 10_000 })
        .toBe(before + 1);
      const latest = await getLatestClickForLink(linkId);
      expect(latest?.source).toBe("profile");
    } finally {
      await deleteBioLinkWithShortSlug(linkId, shortSlug);
    }
  });

  test("bio-link click with no referer records source=direct", async ({ request }) => {
    //* Arrange
    const userId = await getUserIdByUsername(testUsers.pro.username);
    if (userId == null) {
      throw new Error("pro user not found");
    }
    const shortSlug = runScopedSlug("dsrc");
    const linkSlug = `direct-src-${shortSlug}`;
    const linkId = await insertBioLinkWithShortSlug({
      destinationUrl: testDomain.url,
      linkSlug,
      shortSlug,
      title: "Direct Source Test",
      userId,
    });
    const before = await countClicksForLink(linkId);

    try {
      //* Act — no Referer header → server classifies as direct.
      const response = await request.get(`${APP_URL}/${testUsers.pro.username}/${linkSlug}`, {
        maxRedirects: 0,
      });

      //* Assert
      expect(response.status()).toBeGreaterThanOrEqual(300);
      expect(response.status()).toBeLessThan(400);
      await expect
        .poll(() => countClicksForLink(linkId), { intervals: [100, 200, 500, 1000, 2000], timeout: 10_000 })
        .toBe(before + 1);
      const latest = await getLatestClickForLink(linkId);
      expect(latest?.source).toBe("direct");
    } finally {
      await deleteBioLinkWithShortSlug(linkId, shortSlug);
    }
  });
});
