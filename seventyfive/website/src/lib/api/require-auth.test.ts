import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/mcp/auth", () => {
  return {
    authenticateApiRequest: vi.fn(),
  };
});

const { authenticateApiRequest } = await import("@/lib/mcp/auth");
const { requireApiAuth } = await import("./require-auth");

const mockAuth = vi.mocked(authenticateApiRequest);

describe("requireApiAuth", () => {
  it("returns user when API key is valid", async () => {
    //* Arrange
    const user = { id: "user-1", timeZone: "UTC", username: "nich" };
    mockAuth.mockResolvedValue(user);

    //* Act
    const result = await requireApiAuth(
      new Request("https://seventyfive.team/api/v1/teams", {
        headers: { Authorization: "Bearer sf_k_abc" },
      }),
    );

    //* Assert
    expect(result.user).toEqual(user);
    expect(result.response).toBeNull();
  });

  it("returns 401 error when no API key", async () => {
    //* Arrange
    mockAuth.mockResolvedValue(null);

    //* Act
    const result = await requireApiAuth(new Request("https://seventyfive.team/api/v1/teams"));

    //* Assert
    expect(result.user).toBeNull();
    expect(result.response).not.toBeNull();
    expect((result.response as Response).status).toBe(401);
    const body = await (result.response as Response).json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});
