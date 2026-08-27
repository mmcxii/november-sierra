import { describe, expect, it } from "vitest";
import { GET } from "./route";

const TEST_BASE_URL = "https://seventyfive.team";

describe("GET /.well-known/seventyfive.json", () => {
  it("returns discovery JSON", async () => {
    //* Act
    const response = GET();
    const body = await response.json();

    //* Assert
    expect(body).toEqual({
      api: {
        authentication: "Bearer token via API key (Authorization: Bearer sf_k_...)",
        baseUrl: `${TEST_BASE_URL}/api/v1`,
        openApiSpec: `${TEST_BASE_URL}/api/v1/openapi.json`,
      },
      compatibleClients: [
        "OpenClaw",
        "ChatGPT Desktop",
        "Claude Desktop",
        "Claude Code",
        "Claude Agent SDK",
        "Google Gemini",
        "OpenAI Agents SDK",
        "Cursor",
        "Windsurf",
        "Zed",
        "Goose",
        "Cline",
        "Copilot Studio",
      ],
      description: "75-day Hard/Soft accountability tracker for private teams",
      mcp: {
        hosted: `${TEST_BASE_URL}/api/v1/mcp`,
        transport: "streamable-http",
      },
      name: "SeventyFive",
      version: "1.0",
    });
  });

  it("returns cache and content-type headers", () => {
    //* Act
    const response = GET();

    //* Assert
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe("public, s-maxage=3600, stale-while-revalidate=86400");
  });
});
