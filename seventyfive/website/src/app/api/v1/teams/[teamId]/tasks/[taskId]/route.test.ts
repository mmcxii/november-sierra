import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireApiAuth = vi.fn();
vi.mock("@/lib/api/require-auth", () => {
  return {
    requireApiAuth: (...args: unknown[]) => {
      return mockRequireApiAuth(...args);
    },
  };
});

const mockSetTask = vi.fn();
vi.mock("@/lib/mcp/services/tasks", () => {
  return {
    setTask: (...args: unknown[]) => {
      return mockSetTask(...args);
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

const { PATCH } = await import("./route");
const { serviceError, serviceSuccess } = await import("@/lib/mcp/types");

beforeEach(() => {
  vi.clearAllMocks();
});

const USER = { id: "user-1", timeZone: "UTC", username: "nich" };
const PARAMS = { params: Promise.resolve({ taskId: "water", teamId: "team-1" }) };

function patchRequest(body: unknown) {
  return new Request("https://seventyfive.team/api/v1/teams/team-1/tasks/water", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });
}

describe("PATCH /api/v1/teams/[teamId]/tasks/[taskId]", () => {
  it("checks a task", async () => {
    //* Arrange
    mockRequireApiAuth.mockResolvedValue({ response: null, user: USER });
    mockSetTask.mockResolvedValue(
      serviceSuccess({ checked: true, date: "2026-08-27", taskId: "water", teamCelebration: false }),
    );

    //* Act
    const response = await PATCH(patchRequest({ checked: true }), PARAMS);
    const body = await response.json();

    //* Assert
    expect(response.status).toBe(200);
    expect(body.data.checked).toBe(true);
    expect(mockSetTask).toHaveBeenCalledWith(USER, {
      checked: true,
      date: undefined,
      taskId: "water",
      teamId: "team-1",
    });
  });

  it("rejects invalid JSON", async () => {
    //* Arrange
    mockRequireApiAuth.mockResolvedValue({ response: null, user: USER });

    //* Act
    const response = await PATCH(
      new Request("https://seventyfive.team/api/v1/teams/team-1/tasks/water", {
        body: "not-json",
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      }),
      PARAMS,
    );
    const body = await response.json();

    //* Assert
    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("maps a read-only day to 403", async () => {
    //* Arrange
    mockRequireApiAuth.mockResolvedValue({ response: null, user: USER });
    mockSetTask.mockResolvedValue(serviceError("thisDayIsReadOnly", "This day is read-only."));

    //* Act
    const response = await PATCH(patchRequest({ checked: true }), PARAMS);
    const body = await response.json();

    //* Assert
    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });
});
