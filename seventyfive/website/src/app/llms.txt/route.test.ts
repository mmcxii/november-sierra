import { describe, expect, it } from "vitest";
import { GET } from "./route";

const TEST_BASE_URL = "https://seventyfive.team";

describe("GET /llms.txt", () => {
  it("returns text/plain with cache headers", () => {
    //* Act
    const response = GET();

    //* Assert
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("public, s-maxage=3600, stale-while-revalidate=86400");
  });

  it("documents REST and MCP", async () => {
    //* Act
    const response = GET();
    const text = await response.text();

    //* Assert
    expect(text).toMatch(/^# SeventyFive\n/);
    expect(text).toContain("> SeventyFive is a 75-day Hard/Soft accountability tracker");
    expect(text).toContain("## API");
    expect(text).toContain("## MCP Server");
    expect(text).toContain("/api/v1/teams");
    expect(text).toContain("/api/v1/openapi.json");
    expect(text).toContain(`${TEST_BASE_URL}/api/v1/mcp`);
    expect(text).toContain("list_teams");
    expect(text).toContain("get_board");
    expect(text).toContain("set_task");
    expect(text).toContain("OpenClaw");
  });
});
