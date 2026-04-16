import { expect as baseExpect, test as baseTest } from "@playwright/test";
import { createLink, deleteLink, expect, test } from "../fixtures/auth";
import { createTestApiKey, deleteTestApiKeys } from "../fixtures/db";
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
  test("developers page loads", async ({ page }) => {
    //* Act
    await page.goto("/developers");

    //* Assert
    await expect(page.getByRole("heading", { exact: true, name: t.builtForTheAiAgentEra })).toBeVisible();
  });

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
    await expect(page.getByRole("heading", { exact: true, name: t.links })).toBeVisible();
  });

  test("short links page loads", async ({ proUser: page }) => {
    //* Act
    await page.goto("/dashboard/short-links");

    //* Assert
    await expect(page.getByRole("heading", { exact: true, name: t.shortLinks })).toBeVisible();
  });

  test("API keys page loads", async ({ proUser: page }) => {
    //* Act
    await page.goto("/dashboard/api");

    //* Assert
    await expect(page.getByRole("heading", { exact: true, name: t.api })).toBeVisible();
  });

  test("short link create + anch.to redirect works end-to-end", async ({ request }) => {
    //* Arrange — fresh API key against the deployed stage API.
    const apiKey = await createTestApiKey(testUsers.pro.username);

    try {
      //* Act — create via REST, then follow the redirect.
      const createResp = await request.post(`/api/v1/short-links`, {
        data: { url: "https://anchr-e2e-testing.site" },
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      });
      const createdBody = createResp.status() === 201 ? await createResp.json() : null;
      const redirectResp =
        createdBody != null ? await request.get(createdBody.data.shortUrl, { maxRedirects: 0 }) : null;

      //* Assert — the deployed short domain resolves and redirects to the
      //  destination. This is the end-to-end check: middleware + /r/[slug] +
      //  DB lookup all reachable from the internet post-deploy.
      expect(createResp.status()).toBe(201);
      // Stage uses stage.anch.to; prod uses anch.to. Match both.
      expect(createdBody?.data.shortUrl).toMatch(/^https:\/\/(?:[a-z0-9-]+\.)*anch\.to\/[a-z0-9]+$/);
      expect(redirectResp?.status()).toBeGreaterThanOrEqual(300);
      expect(redirectResp?.status()).toBeLessThan(400);
      expect(redirectResp?.headers().location).toBe("https://anchr-e2e-testing.site");

      //* Arrange — cleanup
      if (createdBody?.data.id != null) {
        await request.delete(`/api/v1/short-links/${createdBody.data.id}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
      }
    } finally {
      await deleteTestApiKeys(testUsers.pro.username).catch(() => undefined);
    }
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
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();

    // Clean up any leftover domain from a previous run
    const removeButton = page.getByRole("button", { name: t.removeDomain });
    if (await removeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await removeButton.click();
      await page.getByText(t.domainRemoved).waitFor();
      await page.waitForTimeout(1000);
    }

    // Add domain — use exact match so we don't collide with the short-domain
    // input ("go.yourdomain.com") that lives in the same settings page.
    const domainInput = page.getByPlaceholder("yourdomain.com", { exact: true });
    await domainInput.clear();
    await domainInput.pressSequentially(testDomain.subdomain, { delay: 20 });
    await page.getByRole("button", { name: t.addDomain }).click();
    await page.waitForTimeout(2000);
    await page.reload();
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();
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
    await page.getByRole("heading", { exact: true, name: t.settings }).waitFor();
    await page.getByRole("button", { name: t.removeDomain }).click();
    await page.getByText(t.domainRemoved).waitFor();
  });
});

baseTest.describe("status endpoints smoke tests", () => {
  baseTest("health check returns ok", async ({ request }) => {
    //* Act
    const response = await request.get("/api/status/health");

    //* Assert
    baseExpect(response.status()).toBe(200);

    const body = await response.json();
    baseExpect(body.status).toBe("ok");
  });

  baseTest("redis health cron rejects unauthenticated requests", async ({ request }) => {
    //* Act
    const response = await request.get("/api/cron/redis-health");

    //* Assert
    baseExpect(response.status()).toBe(401);
  });

  baseTest("redis health cron returns ok with valid secret", async ({ request }) => {
    //* Act
    const response = await request.get("/api/cron/redis-health", {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    });

    //* Assert
    baseExpect(response.status()).toBe(200);

    const body = await response.json();
    baseExpect(body.status).toBe("ok");
    baseExpect(body.latencyMs).toBeLessThan(500);
  });

  baseTest("release endpoint returns commit and timestamp", async ({ request }) => {
    //* Act
    const response = await request.get("/api/status/release");

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
    baseExpect(body.api).toBeDefined();
    baseExpect(body.api.baseUrl).toContain("/api/v1");
    baseExpect(body.api.docs).toContain("/docs");
    baseExpect(body.api.openApiSpec).toContain("/api/v1/openapi.json");
    baseExpect(body.api.authentication).toContain("Bearer");
    baseExpect(body.mcp).toBeDefined();
    baseExpect(body.mcp.hosted).toContain("/api/v1/mcp");
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
    baseExpect(text).toContain("## API");
    baseExpect(text).toContain("/api/v1");
    baseExpect(text).toContain("/api/v1/openapi.json");
  });
});

baseTest.describe("public API smoke tests", () => {
  baseTest("GET /api/v1/openapi.json returns valid OpenAPI spec", async ({ request }) => {
    const response = await request.get("/api/v1/openapi.json");

    baseExpect(response.status()).toBe(200);
    baseExpect(response.headers()["content-type"]).toContain("application/json");
    baseExpect(response.headers()["access-control-allow-origin"]).toBe("*");

    const body = await response.json();
    baseExpect(body.openapi).toBe("3.1.0");
    baseExpect(body.info.title).toBe("Anchr API");
    baseExpect(body.paths).toBeDefined();
    baseExpect(body.paths["/api/v1/me"]).toBeDefined();
    baseExpect(body.paths["/api/v1/links"]).toBeDefined();
    baseExpect(body.paths["/api/v1/groups"]).toBeDefined();
    baseExpect(body.paths["/api/v1/analytics"]).toBeDefined();
  });

  baseTest("GET /api/v1/users/:username returns public profile", async ({ request }) => {
    const response = await request.get(`/api/v1/users/${testUsers.pro.username}`);

    baseExpect(response.status()).toBe(200);
    baseExpect(response.headers()["access-control-allow-origin"]).toBe("*");

    const body = await response.json();
    baseExpect(body.data).toBeDefined();
    baseExpect(body.data.username).toBe(testUsers.pro.username);
    baseExpect(body.data.profileUrl).toBeDefined();
    baseExpect(Array.isArray(body.data.links)).toBe(true);
    baseExpect(Array.isArray(body.data.groups)).toBe(true);
  });

  baseTest("GET /api/v1/users/:username returns 404 for nonexistent user", async ({ request }) => {
    const response = await request.get("/api/v1/users/this-user-definitely-does-not-exist-12345");

    baseExpect(response.status()).toBe(404);

    const body = await response.json();
    baseExpect(body.error.code).toBe("NOT_FOUND");
  });

  baseTest("GET /api/v1/me without auth returns 401", async ({ request }) => {
    const response = await request.get("/api/v1/me");

    baseExpect(response.status()).toBe(401);

    const body = await response.json();
    baseExpect(body.error.code).toBe("UNAUTHORIZED");
  });

  baseTest("GET /api/v1/links without auth returns 401", async ({ request }) => {
    const response = await request.get("/api/v1/links");

    baseExpect(response.status()).toBe(401);

    const body = await response.json();
    baseExpect(body.error.code).toBe("UNAUTHORIZED");
  });

  baseTest("API v1 responses include rate limit headers", async ({ request }) => {
    //* Act
    const response = await request.get(`/api/v1/users/${testUsers.pro.username}`);

    //* Assert
    const headers = response.headers();
    baseExpect(headers["x-ratelimit-limit"]).toBeDefined();
    baseExpect(headers["x-ratelimit-remaining"]).toBeDefined();
    baseExpect(headers["x-ratelimit-reset"]).toBeDefined();
    baseExpect(Number(headers["x-ratelimit-limit"])).toBe(60);
    baseExpect(Number(headers["x-ratelimit-remaining"])).toBeGreaterThanOrEqual(0);
    baseExpect(Number(headers["x-ratelimit-reset"])).toBeGreaterThanOrEqual(0);
  });

  baseTest("OPTIONS /api/v1/me returns CORS preflight headers", async ({ request }) => {
    const response = await request.fetch("/api/v1/me", { method: "OPTIONS" });

    baseExpect(response.status()).toBe(204);
    baseExpect(response.headers()["access-control-allow-origin"]).toBe("*");
    baseExpect(response.headers()["access-control-allow-methods"]).toContain("GET");
    baseExpect(response.headers()["access-control-allow-headers"]).toContain("Authorization");
  });
});

baseTest.describe("MCP server smoke tests", () => {
  baseTest("POST /api/v1/mcp without auth returns 401", async ({ request }) => {
    //* Act
    const response = await request.post("/api/v1/mcp", {
      data: {
        id: 1,
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          capabilities: {},
          clientInfo: { name: "smoke-test", version: "1.0.0" },
          protocolVersion: "2025-03-26",
        },
      },
      headers: { "Content-Type": "application/json" },
    });

    //* Assert
    baseExpect(response.status()).toBe(401);

    const body = await response.json();
    baseExpect(body.error.code).toBe("UNAUTHORIZED");
  });

  baseTest("POST /api/v1/mcp with invalid key returns 401", async ({ request }) => {
    //* Act
    const response = await request.post("/api/v1/mcp", {
      data: {
        id: 1,
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          capabilities: {},
          clientInfo: { name: "smoke-test", version: "1.0.0" },
          protocolVersion: "2025-03-26",
        },
      },
      headers: {
        Authorization: "Bearer anc_k_invalidkeyinvalidkeyinvalidkeyinvalid",
        "Content-Type": "application/json",
      },
    });

    //* Assert
    baseExpect(response.status()).toBe(401);
  });

  baseTest("OPTIONS /api/v1/mcp returns CORS preflight headers", async ({ request }) => {
    //* Act
    const response = await request.fetch("/api/v1/mcp", { method: "OPTIONS" });

    //* Assert
    baseExpect(response.status()).toBe(204);
    baseExpect(response.headers()["access-control-allow-origin"]).toBe("*");
    baseExpect(response.headers()["access-control-allow-methods"]).toContain("POST");
  });

  baseTest("MCP server initializes and lists tools for Pro user", async ({ request }) => {
    //* Arrange
    const mcp = await createMcpHelper(request);

    try {
      //* Act — initialize the MCP session
      const initBody = await mcp.initialize();

      //* Assert — server accepts the connection
      baseExpect(initBody.result.serverInfo.name).toBe("Anchr");
      baseExpect(initBody.result.serverInfo.version).toBe("1.0.0");
      baseExpect(initBody.result.capabilities.tools).toBeDefined();

      //* Act — list available tools
      const toolsBody = await mcp.rpc("tools/list", {});

      //* Assert — all 24 tools are listed (3 profile + 7 link + 4 group + 4 short-link + 5 analytics + 1 discovery)
      const toolNames: string[] = toolsBody.result.tools.map((tool: { name: string }) => tool.name);
      baseExpect(toolNames).toHaveLength(24);
      baseExpect(toolNames).toContain("get_profile");
      baseExpect(toolNames).toContain("create_link");
      baseExpect(toolNames).toContain("list_groups");
      baseExpect(toolNames).toContain("get_analytics");
      baseExpect(toolNames).toContain("lookup_profile");
      baseExpect(toolNames).toContain("list_short_links");
      baseExpect(toolNames).toContain("create_short_link");
      baseExpect(toolNames).toContain("update_short_link");
      baseExpect(toolNames).toContain("delete_short_link");
    } finally {
      //* Cleanup
      await mcp.cleanup();
    }
  });

  baseTest("MCP get_profile tool returns user data for Pro user", async ({ request }) => {
    //* Arrange
    const mcp = await createMcpHelper(request);

    try {
      //* Act
      await mcp.initialize();
      const data = await mcp.callTool("get_profile", {});

      //* Assert
      baseExpect(data.username).toBe(testUsers.pro.username);
      baseExpect(data.tier).toBe("pro");
      baseExpect(data.profileUrl).toBeDefined();
    } finally {
      //* Cleanup
      await mcp.cleanup();
    }
  });
});

// ---------- MCP test helper ----------

/**
 * Creates a short-lived MCP test client backed by a real API key.
 * Handles key creation, JSON-RPC plumbing, and cleanup.
 */
type RequestLike = {
  post: (
    url: string,
    options: Record<string, unknown>,
  ) => Promise<{ json: () => Promise<unknown>; status: () => number }>;
};

async function createMcpHelper(request: RequestLike, username: string = testUsers.pro.username) {
  const rawKey = await createTestApiKey(username);
  const headers = {
    Accept: "application/json, text/event-stream",
    Authorization: `Bearer ${rawKey}`,
    "Content-Type": "application/json",
  };
  let nextId = 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function rpc(method: string, params: unknown): Promise<any> {
    const response = await request.post("/api/v1/mcp", {
      data: { id: nextId++, jsonrpc: "2.0", method, params },
      headers,
    });
    baseExpect(response.status()).toBe(200);
    return response.json();
  }

  async function initialize() {
    return rpc("initialize", {
      capabilities: {},
      clientInfo: { name: "smoke-test", version: "1.0.0" },
      protocolVersion: "2025-03-26",
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function callToolRaw(name: string, args: unknown): Promise<any> {
    const body = await rpc("tools/call", { arguments: args, name });
    return body.result;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function callTool(name: string, args: unknown): Promise<any> {
    const result = await callToolRaw(name, args);
    baseExpect(result.isError, `${name} returned error: ${result.content?.[0]?.text}`).toBeFalsy();
    return JSON.parse(result.content[0].text);
  }

  async function cleanup() {
    await deleteTestApiKeys(username);
  }

  return { callTool, callToolRaw, cleanup, headers, initialize, rpc };
}
