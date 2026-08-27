import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireApiAuth = vi.fn();
vi.mock("@/lib/api/require-auth", () => {
  return {
    requireApiAuth: (...args: unknown[]) => {
      return mockRequireApiAuth(...args);
    },
  };
});

const mockGetBoard = vi.fn();
vi.mock("@/lib/mcp/services/board", () => {
  return {
    getBoard: (...args: unknown[]) => {
      return mockGetBoard(...args);
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

const { GET } = await import("./route");
const { serviceError, serviceSuccess } = await import("@/lib/mcp/types");

const USER = { id: "user-1", timeZone: "UTC", username: "nich" };
const PARAMS = { params: Promise.resolve({ teamId: "team-1" }) };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/v1/teams/[teamId]/board", () => {
  it("returns the board for today", async () => {
    //* Arrange
    mockRequireApiAuth.mockResolvedValue({ response: null, user: USER });
    mockGetBoard.mockResolvedValue(serviceSuccess({ date: "2026-08-27", me: { tasks: [] } }));

    //* Act
    const response = await GET(new Request("https://seventyfive.team/api/v1/teams/team-1/board"), PARAMS);
    const body = await response.json();

    //* Assert
    expect(response.status).toBe(200);
    expect(body.data.date).toBe("2026-08-27");
    expect(mockGetBoard).toHaveBeenCalledWith(USER, { date: undefined, teamId: "team-1" });
  });

  it("passes a valid date query", async () => {
    //* Arrange
    mockRequireApiAuth.mockResolvedValue({ response: null, user: USER });
    mockGetBoard.mockResolvedValue(serviceSuccess({ date: "2026-08-26" }));

    //* Act
    await GET(new Request("https://seventyfive.team/api/v1/teams/team-1/board?date=2026-08-26"), PARAMS);

    //* Assert
    expect(mockGetBoard).toHaveBeenCalledWith(USER, { date: "2026-08-26", teamId: "team-1" });
  });

  it("rejects an invalid date query", async () => {
    //* Arrange
    mockRequireApiAuth.mockResolvedValue({ response: null, user: USER });

    //* Act
    const response = await GET(new Request("https://seventyfive.team/api/v1/teams/team-1/board?date=nope"), PARAMS);
    const body = await response.json();

    //* Assert
    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockGetBoard).not.toHaveBeenCalled();
  });

  it("maps membership errors to 404", async () => {
    //* Arrange
    mockRequireApiAuth.mockResolvedValue({ response: null, user: USER });
    mockGetBoard.mockResolvedValue(serviceError("NOT_FOUND", "You are not a member of that team."));

    //* Act
    const response = await GET(new Request("https://seventyfive.team/api/v1/teams/team-1/board"), PARAMS);
    const body = await response.json();

    //* Assert
    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
