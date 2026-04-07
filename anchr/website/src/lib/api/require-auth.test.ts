import { describe, expect, it, vi } from "vitest";
// Mock the auth module before importing
vi.mock("./auth", () => ({
  authenticateApiRequest: vi.fn(),
}));
import { authenticateApiRequest } from "./auth";
import { requireApiAuth, requirePro } from "./require-auth";

const mockAuth = vi.mocked(authenticateApiRequest);

describe("requireApiAuth", () => {
  it("returns user when API key is valid", async () => {
    //* Act
    const user = { id: "user-1", tier: "pro" as const, username: "nick" };
    mockAuth.mockResolvedValue(user);

    const request = new Request("https://anchr.to/api/v1/me", {
      headers: { Authorization: "Bearer anc_k_abc123" },
    });

    const result = await requireApiAuth(request);

    //* Assert
    expect(result.user).toEqual(user);
    expect(result.response).toBeNull();
  });

  it("returns 401 error when no API key", async () => {
    //* Act
    mockAuth.mockResolvedValue(null);

    const request = new Request("https://anchr.to/api/v1/me");
    const result = await requireApiAuth(request);

    //* Assert
    expect(result.user).toBeNull();
    expect(result.response).not.toBeNull();
    expect((result.response as Response).status).toBe(401);

    const body = await (result.response as Response).json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});

describe("requirePro", () => {
  it("returns null for pro users", () => {
    //* Act
    const result = requirePro({ id: "user-1", tier: "pro", username: "nick" });

    //* Assert
    expect(result).toBeNull();
  });

  it("returns 403 error for free users", async () => {
    //* Act
    const result = requirePro({ id: "user-1", tier: "free", username: "nick" });

    //* Assert
    expect(result).not.toBeNull();
    expect((result as Response).status).toBe(403);

    const body = await (result as Response).json();
    expect(body.error.code).toBe("PRO_REQUIRED");
  });
});
