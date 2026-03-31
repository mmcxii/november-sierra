import { expect, test } from "@playwright/test";

/**
 * Post-deploy smoke tests against live production (anchr.to).
 *
 * READ-ONLY — no auth, no data mutations, no test users in the production database.
 * Verifies the deployment landed, the app boots, and key endpoints respond.
 */

test.describe("production deployment smoke tests", () => {
  test("health check returns ok", async ({ request }) => {
    //* Act
    const response = await request.get("/api/__status__/health");

    //* Assert
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("ok");
  });

  test("release endpoint returns commit and timestamp", async ({ request }) => {
    //* Act
    const response = await request.get("/api/__status__/release");

    //* Assert
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.commitSha).toBeTruthy();
    expect(body.deployedAt).toBeTruthy();
    expect(Number.isNaN(Date.parse(body.deployedAt))).toBe(false);

    const expectedSha = process.env.EXPECTED_COMMIT_SHA;
    if (expectedSha != null) {
      expect(body.commitSha).toBe(expectedSha);
    }
  });

  test("app boots and serves the landing page", async ({ page }) => {
    //* Act
    await page.goto("/");

    //* Assert
    await expect(page.locator("body")).not.toBeEmpty();
    await expect(page.locator("text=APPLICATION_ERROR")).not.toBeVisible();
  });

  test("/.well-known/anchr.json returns valid discovery metadata", async ({ request }) => {
    //* Act
    const response = await request.get("/.well-known/anchr.json");

    //* Assert
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");

    const body = await response.json();
    expect(body.name).toBe("Anchr");
    expect(body.version).toBe("1.0");
    expect(body.profiles).toBeDefined();
    expect(body.profiles.urlPattern).toContain("{username}");
  });

  test("/llms.txt returns valid LLM-readable site description", async ({ request }) => {
    //* Act
    const response = await request.get("/llms.txt");

    //* Assert
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/plain");

    const text = await response.text();
    expect(text).toContain("# Anchr");
  });
});
