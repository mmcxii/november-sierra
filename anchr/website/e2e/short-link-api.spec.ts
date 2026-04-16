import { expect, test as baseTest } from "@playwright/test";
import { createTestApiKey, deleteAllShortLinksForUser, deleteTestApiKeys, setUserShortDomain } from "./fixtures/db";
import { testDomain, testUsers } from "./fixtures/test-users";

/**
 * REST API for short links (/api/v1/short-links). Exercises the full CRUD lane
 * authenticated via an API key. The service layer has unit coverage; this spec
 * is a thin round-trip check that the HTTP routes, Zod schemas, and
 * authorization middleware are wired together correctly.
 */

const APP_URL = "http://localhost:3000";
const test = baseTest;

test.describe("short links REST API", () => {
  test.describe.configure({ mode: "serial" });

  let apiKey: string;
  let createdId: undefined | string;

  test.beforeAll(async () => {
    apiKey = await createTestApiKey(testUsers.pro.username);
  });

  test.afterAll(async () => {
    // Best-effort cleanup — ignore errors if the key is already gone. Also
    // tear down any short_links this spec or its failed runs left behind, so
    // the short-links UI empty-state test downstream isn't polluted.
    await deleteAllShortLinksForUser(testUsers.pro.username).catch(() => undefined);
    await deleteTestApiKeys(testUsers.pro.username).catch(() => undefined);
  });

  test("POST creates a short link and returns the expected shape", async ({ request }) => {
    //* Act
    const response = await request.post(`${APP_URL}/api/v1/short-links`, {
      data: { url: testDomain.url },
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });

    //* Assert — apiSuccess() wraps in { data: ... }.
    expect(response.status()).toBe(201);
    const { data } = await response.json();
    expect(data.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(data.slug).toMatch(/^[a-z0-9]+$/);
    expect(data.shortUrl).toMatch(/^https:\/\/anch\.to\/[a-z0-9]+$/);
    expect(data.url).toBe(testDomain.url);
    expect(data.passwordProtected).toBe(false);

    createdId = data.id as string;
  });

  test("POST with customSlug uses the caller-supplied slug verbatim", async ({ request }) => {
    //* Arrange — customSlug requires a verified users.short_domain.
    await setUserShortDomain(testUsers.pro.username, testDomain.shortSubdomain);
    const customSlug = `api-custom-${Date.now().toString(36)}`;

    try {
      //* Act
      const response = await request.post(`${APP_URL}/api/v1/short-links`, {
        data: { customSlug, url: testDomain.url },
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      });

      //* Assert — API honors the requested customSlug instead of auto-generating.
      //  Guards against a class of regressions where the server quietly drops
      //  customSlug (e.g., schema validation strips it, service layer ignores it).
      expect(response.status()).toBe(201);
      const { data } = await response.json();
      expect(data.customSlug).toBe(customSlug);
      // shortUrl should still be valid, and the slug field is the auto-gen global
      // anch.to slug (not the customSlug which is per-user-short-domain only).
      expect(data.shortUrl).toMatch(/^https:\/\/anch\.to\/[a-z0-9]+$/);

      //* Arrange — cleanup the created link.
      await request.delete(`${APP_URL}/api/v1/short-links/${data.id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
    } finally {
      await setUserShortDomain(testUsers.pro.username, null);
    }
  });

  test("POST with customSlug is rejected when no verified short_domain is set", async ({ request }) => {
    //* Arrange — ensure the pro user has no short_domain configured.
    await setUserShortDomain(testUsers.pro.username, null);

    //* Act
    const response = await request.post(`${APP_URL}/api/v1/short-links`, {
      data: { customSlug: `api-nodom-${Date.now().toString(36)}`, url: testDomain.url },
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });

    //* Assert — server-side gating: 400 VALIDATION_ERROR. Belts-and-suspenders
    //  against a UI regression that re-exposes the customSlug input without
    //  gating; the API must still refuse.
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error?.code).toBe("VALIDATION_ERROR");
  });

  test("GET lists the short link we just created", async ({ request }) => {
    //* Arrange — need the previous test's id.
    if (createdId == null) {
      throw new Error("createdId not populated by prior POST test");
    }

    //* Act
    const response = await request.get(`${APP_URL}/api/v1/short-links`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    //* Assert
    expect(response.status()).toBe(200);
    const { data } = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.find((row: { id: string }) => row.id === createdId)).toBeTruthy();
  });

  test("PATCH updates the short link URL", async ({ request }) => {
    //* Arrange
    if (createdId == null) {
      throw new Error("createdId not populated");
    }
    const newUrl = `${testDomain.url}/?v=patched`;

    //* Act
    const response = await request.patch(`${APP_URL}/api/v1/short-links/${createdId}`, {
      data: { url: newUrl },
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });

    //* Assert
    expect(response.status()).toBe(200);
    const { data } = await response.json();
    expect(data.url).toBe(newUrl);
  });

  test("DELETE tombstones the short link (404 on subsequent GET by id)", async ({ request }) => {
    //* Arrange
    if (createdId == null) {
      throw new Error("createdId not populated");
    }

    //* Act
    const deleteResponse = await request.delete(`${APP_URL}/api/v1/short-links/${createdId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const followupResponse = await request.get(`${APP_URL}/api/v1/short-links/${createdId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    //* Assert — apiSuccess(null) returns 200 with { data: null }; resource is gone on GET.
    expect(deleteResponse.status()).toBe(200);
    expect(followupResponse.status()).toBe(404);
  });

  test("unauthenticated request is rejected with 401", async ({ request }) => {
    //* Act
    const response = await request.get(`${APP_URL}/api/v1/short-links`);

    //* Assert
    expect(response.status()).toBe(401);
  });

  test("invalid bearer token is rejected with 401", async ({ request }) => {
    //* Act
    const response = await request.get(`${APP_URL}/api/v1/short-links`, {
      headers: { Authorization: "Bearer anc_k_notarealkey" },
    });

    //* Assert
    expect(response.status()).toBe(401);
  });
});
