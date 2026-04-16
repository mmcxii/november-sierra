import { expect, test } from "./fixtures/auth";
import {
  deleteShortLinkFixture,
  getUserIdByUsername,
  hashShortLinkPassword,
  insertShortLinkFixture,
} from "./fixtures/db";
import { testDomain, testUsers } from "./fixtures/test-users";

/**
 * Exercises /unlock/<slug> — the UI password gate for password-protected
 * short links. Security-critical: the redirect test confirms the gate is
 * presented; these tests confirm it actually gates (wrong password blocks,
 * correct password unlocks, only the matching password is accepted).
 */

function runScopedSlug(label: string): string {
  const runId = process.env.E2E_RUN_ID ?? "local";
  const safe =
    runId
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(-5) || "x";
  return `${label}${safe}`.slice(0, 12);
}

test.describe("short-link unlock", () => {
  test.describe.configure({ mode: "serial" });

  test("correct password unlocks and navigates to destination", async ({ page }) => {
    //* Arrange
    const userId = await getUserIdByUsername(testUsers.pro.username);
    if (userId == null) {
      throw new Error("pro user not found");
    }
    const slug = runScopedSlug("ok");
    const password = "correct-horse-battery-staple";
    const passwordHash = await hashShortLinkPassword(password);
    await insertShortLinkFixture({ destinationUrl: testDomain.url, passwordHash, slug, userId });

    try {
      //* Act
      await page.goto(`/unlock/${slug}`);
      await page.getByPlaceholder("Enter password").waitFor();
      await page.getByPlaceholder("Enter password").fill(password);
      await page.getByRole("button", { name: /unlock/i }).click();

      //* Assert — client does window.location.href = destination; we wait for
      //  the browser to land on the destination. Browsers may normalize trailing
      //  slashes on empty paths, so compare by origin+pathname rather than raw
      //  equality with testDomain.url.
      await page.waitForURL((url) => url.origin === new URL(testDomain.url).origin, { timeout: 10_000 });
      expect(new URL(page.url()).origin).toBe(new URL(testDomain.url).origin);
    } finally {
      await deleteShortLinkFixture(slug);
    }
  });

  test("wrong password shows an error and does not navigate", async ({ page }) => {
    //* Arrange
    const userId = await getUserIdByUsername(testUsers.pro.username);
    if (userId == null) {
      throw new Error("pro user not found");
    }
    const slug = runScopedSlug("bad");
    const passwordHash = await hashShortLinkPassword("correct-password");
    await insertShortLinkFixture({ destinationUrl: testDomain.url, passwordHash, slug, userId });

    try {
      //* Act
      await page.goto(`/unlock/${slug}`);
      await page.getByPlaceholder("Enter password").fill("wrong-password");
      await page.getByRole("button", { name: /unlock/i }).click();

      //* Assert — stays on the unlock page, error message rendered.
      await expect(page.getByText(/incorrect password/i)).toBeVisible();
      expect(page.url()).toContain(`/unlock/${slug}`);
    } finally {
      await deleteShortLinkFixture(slug);
    }
  });

  test("non-password-protected slug redirects away from /unlock", async ({ page }) => {
    //* Arrange — create a short link with no password hash.
    const userId = await getUserIdByUsername(testUsers.pro.username);
    if (userId == null) {
      throw new Error("pro user not found");
    }
    const slug = runScopedSlug("np");
    await insertShortLinkFixture({ destinationUrl: testDomain.url, slug, userId });

    try {
      //* Act
      await page.goto(`/unlock/${slug}`, { waitUntil: "load" });

      //* Assert — unlock page redirects to app root for non-password links
      //  (verified server-side before rendering the form).
      expect(page.url()).not.toContain(`/unlock/${slug}`);
    } finally {
      await deleteShortLinkFixture(slug);
    }
  });
});
