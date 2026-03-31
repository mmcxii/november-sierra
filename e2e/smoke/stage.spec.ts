import { expect as baseExpect, test as baseTest } from "@playwright/test";
import { createLink, deleteLink, expect, test } from "../fixtures/auth";
import { t } from "../fixtures/i18n";
import { testDomain, testUsers } from "../fixtures/test-users";

/**
 * Post-deploy smoke tests against live stage.anchr.to.
 *
 * These run AFTER deployment to verify the deployed build works.
 * They're a focused subset — the full E2E suite runs in CI against localhost.
 * The critical addition here is the custom domain browser navigation test
 * which can only be validated against a real deployment with real DNS.
 */

test.describe("stage deployment smoke tests", () => {
  test("app boots and serves the landing page", async ({ page }) => {
    //* Act
    await page.goto("/");

    //* Assert — page loaded, not a Vercel error or blank page
    await expect(page.getByRole("link", { name: t.getStarted }).first()).toBeVisible();
  });

  test("authenticated user can access dashboard", async ({ proUser: page }) => {
    //* Act
    await page.goto("/dashboard");

    //* Assert
    await expect(page.getByRole("heading", { name: t.links })).toBeVisible();
  });

  test("API keys page loads", async ({ proUser: page }) => {
    //* Act
    await page.goto("/dashboard/api");

    //* Assert
    await expect(page.getByRole("heading", { exact: true, name: t.api })).toBeVisible();
  });

  test("link CRUD works end-to-end", async ({ proUser: page }) => {
    //* Act — create
    await createLink(page, "Smoke Test Link", "https://example.com/smoke");

    //* Assert — link appears
    await expect(page.getByText("Smoke Test Link")).toBeVisible();

    //* Act — delete
    await deleteLink(page, "Smoke Test Link");

    //* Assert — link gone
    await expect(page.getByText("Smoke Test Link")).toBeHidden();
  });

  test("public profile is accessible", async ({ proUser: page }) => {
    //* Arrange
    await createLink(page, "Smoke Profile Link", "https://example.com/smoke-profile");

    //* Act
    await page.goto(`/${testUsers.pro.username}`);

    //* Assert
    await expect(page.getByRole("link", { name: "Smoke Profile Link" })).toBeVisible();

    //* Arrange — cleanup
    await page.goto("/dashboard");
    await deleteLink(page, "Smoke Profile Link");
  });

  test("public profile contains JSON-LD structured data", async ({ proUser: page }) => {
    //* Arrange — create a link so the profile has content
    await createLink(page, "JSON-LD Smoke Link", "https://example.com/jsonld-smoke");

    //* Act — visit the public profile
    await page.goto(`/${testUsers.pro.username}`);
    await page.getByRole("link", { name: "JSON-LD Smoke Link" }).waitFor();

    //* Assert — JSON-LD script tag is present with @graph structure
    const scriptTag = page.locator('script[type="application/ld+json"]');
    const scriptContent = await scriptTag.textContent();
    const jsonLd = scriptContent != null ? JSON.parse(scriptContent) : null;

    expect(jsonLd).not.toBeNull();
    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(Array.isArray(jsonLd["@graph"])).toBe(true);

    const types = jsonLd["@graph"].map((node: { "@type": string }) => node["@type"]);
    expect(types).toContain("ProfilePage");
    expect(types).toContain("ItemList");

    // Verify the ItemList contains our smoke link
    const itemList = jsonLd["@graph"].find((node: { "@type": string }) => node["@type"] === "ItemList");
    expect(itemList.numberOfItems).toBeGreaterThanOrEqual(1);

    //* Cleanup
    await page.goto("/dashboard");
    await deleteLink(page, "JSON-LD Smoke Link");
  });

  test("custom domain serves public profile via real DNS", async ({ browser, proUser: page }) => {
    //* Arrange — add custom domain and create a link
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { name: t.settings }).waitFor();

    // Clean up any leftover domain from a previous run
    const removeButton = page.getByRole("button", { name: t.removeDomain });
    if (await removeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await removeButton.click();
      await page.getByText(t.domainRemoved).waitFor();
      await page.waitForTimeout(1000);
    }

    // Add domain
    const domainInput = page.getByPlaceholder("yourdomain.com");
    await domainInput.clear();
    await domainInput.pressSequentially(testDomain.subdomain, { delay: 20 });
    await page.getByRole("button", { name: t.addDomain }).click();
    await page.waitForTimeout(2000);
    await page.reload();
    await page.getByRole("heading", { name: t.settings }).waitFor();
    await page.getByRole("button", { name: t.verifyDns }).waitFor();

    // Verify DNS (may need a retry if SSL is still provisioning)
    await page.getByRole("button", { name: t.verifyDns }).click();
    await page.waitForTimeout(3000);

    // Create a link so the profile has content
    await page.goto("/dashboard");
    await createLink(page, "Custom Domain Smoke", "https://example.com/smoke-domain");

    //* Act — navigate to the custom domain via a real browser request
    // This is the test that can ONLY work against a live deployment.
    // The browser resolves DNS for the custom domain, hits Vercel's edge,
    // and the middleware rewrites to the user's public profile.
    const context = await browser.newContext();
    const domainPage = await context.newPage();
    await domainPage.goto(`https://${testDomain.subdomain}`, {
      timeout: 30_000,
      waitUntil: "domcontentloaded",
    });

    //* Assert — the user's public profile renders with our link
    await expect(domainPage.getByRole("link", { name: "Custom Domain Smoke" })).toBeVisible();
    await context.close();

    //* Arrange — cleanup
    await deleteLink(page, "Custom Domain Smoke");
    await page.goto("/dashboard/settings");
    await page.getByRole("heading", { name: t.settings }).waitFor();
    await page.getByRole("button", { name: t.removeDomain }).click();
    await page.getByText(t.domainRemoved).waitFor();
  });
});

baseTest.describe("status endpoints smoke tests", () => {
  baseTest("health check returns ok", async ({ request }) => {
    //* Act
    const response = await request.get("/api/__status__/health");

    //* Assert
    baseExpect(response.status()).toBe(200);

    const body = await response.json();
    baseExpect(body.status).toBe("ok");
  });

  baseTest("release endpoint returns commit and timestamp", async ({ request }) => {
    //* Act
    const response = await request.get("/api/__status__/release");

    //* Assert
    baseExpect(response.status()).toBe(200);

    const body = await response.json();
    baseExpect(body.commitSha).toBeTruthy();
    baseExpect(body.deployedAt).toBeTruthy();
    baseExpect(Number.isNaN(Date.parse(body.deployedAt))).toBe(false);

    const expectedSha = process.env.EXPECTED_COMMIT_SHA;
    if (expectedSha != null) {
      baseExpect(body.commitSha).toBe(expectedSha);
    }
  });
});

baseTest.describe("discovery endpoints smoke tests", () => {
  baseTest("/.well-known/anchr.json returns valid discovery metadata", async ({ request }) => {
    const response = await request.get("/.well-known/anchr.json");

    baseExpect(response.status()).toBe(200);
    baseExpect(response.headers()["content-type"]).toContain("application/json");

    const body = await response.json();
    baseExpect(body.name).toBe("Anchr");
    baseExpect(body.version).toBe("1.0");
    baseExpect(body.profiles).toBeDefined();
    baseExpect(body.profiles.urlPattern).toContain("{username}");
    baseExpect(body.profiles.sitemap).toContain("/sitemap.xml");
    baseExpect(body.profiles.structuredData).toContain("JSON-LD");
  });

  baseTest("/llms.txt returns valid LLM-readable site description", async ({ request }) => {
    const response = await request.get("/llms.txt");

    baseExpect(response.status()).toBe(200);
    baseExpect(response.headers()["content-type"]).toContain("text/plain");

    const text = await response.text();
    baseExpect(text).toContain("# Anchr");
    baseExpect(text).toContain("{username}");
    baseExpect(text).toContain("/sitemap.xml");
    baseExpect(text).toContain("/pricing");
  });
});
