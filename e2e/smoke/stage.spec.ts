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

  test("custom domain serves public profile via real DNS", async ({ proUser: page, browser }) => {
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
