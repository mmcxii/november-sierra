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
    const response = await request.get("/api/status/health");

    //* Assert
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("ok");
  });

  test("redis health cron rejects unauthenticated requests", async ({ request }) => {
    //* Act
    const response = await request.get("/api/cron/redis-health");

    //* Assert
    expect(response.status()).toBe(401);
  });

  test("redis health cron returns ok with valid secret", async ({ request }) => {
    //* Act
    const response = await request.get("/api/cron/redis-health", {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    });

    //* Assert
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.latencyMs).toBeLessThan(500);
  });

  test("release endpoint returns commit and timestamp", async ({ request }) => {
    //* Act
    const response = await request.get("/api/status/release");

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
    expect(body.api).toBeDefined();
    expect(body.api.baseUrl).toContain("/api/v1");
    expect(body.api.docs).toContain("/docs");
    expect(body.api.openApiSpec).toContain("/api/v1/openapi.json");
    expect(body.mcp).toBeDefined();
    expect(body.mcp.hosted).toContain("/api/v1/mcp");
  });

  test("/llms.txt returns valid LLM-readable site description", async ({ request }) => {
    //* Act
    const response = await request.get("/llms.txt");

    //* Assert
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/plain");

    const text = await response.text();
    expect(text).toContain("# Anchr");
    expect(text).toContain("## API");
    expect(text).toContain("/api/v1");
  });

  test("GET /api/v1/openapi.json returns valid OpenAPI spec", async ({ request }) => {
    //* Act
    const response = await request.get("/api/v1/openapi.json");

    //* Assert
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");
    expect(response.headers()["access-control-allow-origin"]).toBe("*");

    const body = await response.json();
    expect(body.openapi).toBe("3.1.0");
    expect(body.info.title).toBe("Anchr API");
    expect(body.paths).toBeDefined();
    expect(body.paths["/api/v1/me"]).toBeDefined();
    expect(body.paths["/api/v1/links"]).toBeDefined();
  });

  test("GET /api/v1/me without auth returns 401", async ({ request }) => {
    //* Act
    const response = await request.get("/api/v1/me");

    //* Assert
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  test("API v1 responses include rate limit headers", async ({ request }) => {
    //* Act
    const response = await request.get("/api/v1/openapi.json");

    //* Assert
    const headers = response.headers();
    expect(headers["x-ratelimit-limit"]).toBeDefined();
    expect(headers["x-ratelimit-remaining"]).toBeDefined();
    expect(headers["x-ratelimit-reset"]).toBeDefined();
    expect(Number(headers["x-ratelimit-limit"])).toBe(60);
    expect(Number(headers["x-ratelimit-remaining"])).toBeGreaterThanOrEqual(0);
    expect(Number(headers["x-ratelimit-reset"])).toBeGreaterThanOrEqual(0);
  });

  test("OPTIONS /api/v1/me returns CORS preflight headers", async ({ request }) => {
    //* Act
    const response = await request.fetch("/api/v1/me", { method: "OPTIONS" });

    //* Assert
    expect(response.status()).toBe(204);
    expect(response.headers()["access-control-allow-origin"]).toBe("*");
    expect(response.headers()["access-control-allow-methods"]).toContain("GET");
  });
});

test.describe("MCP server smoke tests", () => {
  test("POST /api/v1/mcp without auth returns 401", async ({ request }) => {
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
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  test("POST /api/v1/mcp with invalid key returns 401", async ({ request }) => {
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
    expect(response.status()).toBe(401);
  });

  test("OPTIONS /api/v1/mcp returns CORS preflight headers", async ({ request }) => {
    //* Act
    const response = await request.fetch("/api/v1/mcp", { method: "OPTIONS" });

    //* Assert
    expect(response.status()).toBe(204);
    expect(response.headers()["access-control-allow-origin"]).toBe("*");
    expect(response.headers()["access-control-allow-methods"]).toContain("POST");
  });
});
