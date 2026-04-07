import { describe, expect, it, vi } from "vitest";

const mockAuthenticateApiRequest = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  authenticateApiRequest: (...args: unknown[]) => mockAuthenticateApiRequest(...args),
}));

vi.mock("@/lib/db/client", () => ({ db: {} }));
vi.mock("@/lib/env", () => ({
  envSchema: { NEXT_PUBLIC_APP_URL: "https://anchr.to" },
}));

vi.mock("@/lib/mcp/server", () => ({
  createMcpServer: vi.fn().mockReturnValue({
    connect: vi.fn(),
  }),
}));

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

// Import after mocks are set up
const { DELETE, GET, OPTIONS, POST } = await import("./route");

function makeRequest(method: string): Request {
  return new Request("https://anchr.to/api/v1/mcp", {
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

  it("returns 403 for free-tier users", async () => {
    //* Arrange
    mockAuthenticateApiRequest.mockResolvedValue({ id: "user-1", tier: "free", username: "freeuser" });

    //* Act
    const response = await POST(makeRequest("POST"));
    const body = await response.json();

    //* Assert
    expect(response.status).toBe(403);
    expect(body.error.code).toBe("PRO_REQUIRED");
  });

  it("forwards to MCP transport for Pro users", async () => {
    //* Arrange
    mockAuthenticateApiRequest.mockResolvedValue({ id: "user-1", tier: "pro", username: "prouser" });

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
