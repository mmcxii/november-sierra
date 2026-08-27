import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireApiAuth = vi.fn();
vi.mock("@/lib/api/require-auth", () => {
  return {
    requireApiAuth: (...args: unknown[]) => {
      return mockRequireApiAuth(...args);
    },
  };
});

const mockListTeams = vi.fn();
vi.mock("@/lib/mcp/services/teams", () => {
  return {
    listTeams: (...args: unknown[]) => {
      return mockListTeams(...args);
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

const { GET, OPTIONS } = await import("./route");
const { serviceSuccess } = await import("@/lib/mcp/types");

const USER = { id: "user-1", timeZone: "UTC", username: "nich" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/v1/teams", () => {
  it("returns 401 when unauthenticated", async () => {
    //* Arrange
    mockRequireApiAuth.mockResolvedValue({
      response: new Response(JSON.stringify({ error: { code: "UNAUTHORIZED" } }), { status: 401 }),
      user: null,
    });

    //* Act
    const response = await GET(new Request("https://seventyfive.team/api/v1/teams"));
    const body = await response.json();

    //* Assert
    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns teams for the authenticated user", async () => {
    //* Arrange
    mockRequireApiAuth.mockResolvedValue({ response: null, user: USER });
    mockListTeams.mockResolvedValue(
      serviceSuccess({ teams: [{ teamId: "team-1", teamName: "Hawaii Prep 2026" }], todayLocal: "2026-08-27" }),
    );

    //* Act
    const response = await GET(new Request("https://seventyfive.team/api/v1/teams"));
    const body = await response.json();

    //* Assert
    expect(response.status).toBe(200);
    expect(body.data.teams[0].teamName).toBe("Hawaii Prep 2026");
  });

  it("returns CORS preflight", () => {
    //* Act
    const response = OPTIONS();

    //* Assert
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
  });
});
