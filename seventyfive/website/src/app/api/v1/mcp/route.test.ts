import { describe, expect, it, vi } from "vitest";

const mockAuthenticateApiRequest = vi.fn();

vi.mock("@/lib/mcp/auth", () => {
  return {
    authenticateApiRequest: (...args: unknown[]) => {
      return mockAuthenticateApiRequest(...args);
    },
  };
});

vi.mock("@/lib/db/client", () => {
  return { db: {} };
});
vi.mock("@/lib/env", () => {
  return {
    envSchema: { NEXT_PUBLIC_APP_URL: "https://seventyfive.team" },
  };
});

vi.mock("@/lib/mcp/server", () => {
  return {
    createMcpServer: vi.fn().mockReturnValue({
      connect: vi.fn(),
    }),
  };
});

vi.mock("@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js", () => {
  return {
    WebStandardStreamableHTTPServerTransport: class {
      handleRequest = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ result: "ok" }), {
          headers: { "content-type": "application/json" },
          status: 200,
        }),
      );
    },
  };
});

const { DELETE, GET, OPTIONS, POST } = await import("./route");

function makeRequest(method: string): Request {
  return new Request("https://seventyfive.team/api/v1/mcp", {
    headers: { "Content-Type": "application/json" },
    method,
  });
}

describe("MCP route handler", () => {
  it("returns 401 for unauthenticated requests", async () => {
    //* Arrange
    mockAuthenticateApiRequest.mockResolvedValue(null);

    //* Act
    const response = await POST(makeRequest("POST"));
    const body = await response.json();

    //* Assert
    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("forwards to MCP transport for authenticated users", async () => {
    //* Arrange
    mockAuthenticateApiRequest.mockResolvedValue({ id: "user-1", timeZone: "UTC", username: "guy" });

    //* Act
    const response = await POST(makeRequest("POST"));

    //* Assert
    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("handles GET and DELETE the same as POST", async () => {
    //* Arrange
    mockAuthenticateApiRequest.mockResolvedValue(null);

    //* Act
    const [getRes, deleteRes] = await Promise.all([GET(makeRequest("GET")), DELETE(makeRequest("DELETE"))]);

    //* Assert
    expect(getRes.status).toBe(401);
    expect(deleteRes.status).toBe(401);
  });

  it("returns 204 with CORS headers for OPTIONS", () => {
    //* Act
    const response = OPTIONS();

    //* Assert
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toContain("POST");
  });
});
