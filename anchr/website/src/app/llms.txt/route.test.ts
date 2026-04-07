import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/env", () => ({
  envSchema: { NEXT_PUBLIC_APP_URL: "https://anchr.to" },
}));

const TEST_BASE_URL = "https://anchr.to";

describe("GET /llms.txt", () => {
  it("returns text/plain content type", () => {
    //* Act
    const response = GET();

    //* Assert
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
  });

  it("returns correct cache-control headers", () => {
    //* Act
    const response = GET();

    //* Assert
    expect(response.headers.get("cache-control")).toBe("public, s-maxage=3600, stale-while-revalidate=86400");
  });

  it("starts with H1 title per llms.txt spec", async () => {
    //* Act
    const response = GET();
    const text = await response.text();

    //* Assert
    expect(text).toMatch(/^# Anchr\n/);
  });

  it("includes blockquote summary per llms.txt spec", async () => {
    //* Act
    const response = GET();
    const text = await response.text();

    //* Assert
    expect(text).toContain("> Anchr is a link-in-bio platform");
  });

  it("includes H2 Profiles section with link list per llms.txt spec", async () => {
    //* Act
    const response = GET();
    const text = await response.text();

    //* Assert
    expect(text).toContain("## Profiles");
    expect(text).toContain(`[Sitemap](${TEST_BASE_URL}/sitemap.xml)`);
    expect(text).toContain(`[Pricing](${TEST_BASE_URL}/pricing)`);
  });

  it("uses NEXT_PUBLIC_APP_URL for base URL", async () => {
    //* Act
    const response = GET();
    const text = await response.text();

    //* Assert
    expect(text).toContain(`${TEST_BASE_URL}/{username}`);
    expect(text).toContain(`${TEST_BASE_URL}/sitemap.xml`);
    expect(text).toContain(`${TEST_BASE_URL}/pricing`);
  });
});
