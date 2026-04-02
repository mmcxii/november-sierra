import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/env", () => ({
  envSchema: { NEXT_PUBLIC_APP_URL: "https://anchr.to" },
}));

const TEST_BASE_URL = "https://anchr.to";

describe("GET /.well-known/anchr.json", () => {
  it("returns valid JSON with correct structure", async () => {
    //* Act
    const response = GET();
    const body = await response.json();

    //* Assert
    expect(body).toEqual({
      api: {
        authentication: "Bearer token via API key (Authorization: Bearer anc_k_...)",
        baseUrl: `${TEST_BASE_URL}/api/v1`,
        docs: `${TEST_BASE_URL}/api/v1/openapi.json`,
      },
      description: "Link-in-bio platform for the AI agent era",
      mcp: {
        hosted: `${TEST_BASE_URL}/api/v1/mcp`,
        npm: "@anthropic/anchr-mcp",
        transport: "streamable-http",
      },
      name: "Anchr",
      profiles: {
        sitemap: `${TEST_BASE_URL}/sitemap.xml`,
        structuredData: "JSON-LD (schema.org ProfilePage, Person, ItemList)",
        urlPattern: `${TEST_BASE_URL}/{username}`,
      },
      version: "1.0",
    });
  });

  it("returns application/json content type", () => {
    //* Act
    const response = GET();

    //* Assert
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("returns correct cache-control headers", () => {
    //* Act
    const response = GET();

    //* Assert
    expect(response.headers.get("cache-control")).toBe("public, s-maxage=3600, stale-while-revalidate=86400");
  });

  it("uses NEXT_PUBLIC_APP_URL for base URL", async () => {
    //* Act
    const response = GET();
    const body = await response.json();

    //* Assert
    expect(body.profiles.urlPattern).toContain(TEST_BASE_URL);
    expect(body.profiles.sitemap).toContain(TEST_BASE_URL);
  });
});
