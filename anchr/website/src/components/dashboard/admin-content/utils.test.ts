import { describe, expect, it } from "vitest";
import { getCodeStatus } from "./utils";

describe("getCodeStatus", () => {
  it("returns 'active' for an active code with no limits", () => {
    //* Arrange
    const code = { active: true, currentRedemptions: 0, expiresAt: null, maxRedemptions: null };

    //* Act
    const result = getCodeStatus(code);

    //* Assert
    expect(result).toBe("active");
  });

  it("returns 'deactivated' when active is false", () => {
    //* Arrange
    const code = { active: false, currentRedemptions: 0, expiresAt: null, maxRedemptions: null };

    //* Act
    const result = getCodeStatus(code);

    //* Assert
    expect(result).toBe("deactivated");
  });

  it("returns 'expired' when expiresAt is in the past", () => {
    //* Arrange
    const code = { active: true, currentRedemptions: 0, expiresAt: new Date("2020-01-01"), maxRedemptions: null };

    //* Act
    const result = getCodeStatus(code);

    //* Assert
    expect(result).toBe("expired");
  });

  it("returns 'exhausted' when currentRedemptions equals maxRedemptions", () => {
    //* Arrange
    const code = { active: true, currentRedemptions: 5, expiresAt: null, maxRedemptions: 5 };

    //* Act
    const result = getCodeStatus(code);

    //* Assert
    expect(result).toBe("exhausted");
  });

  it("returns 'exhausted' when currentRedemptions exceeds maxRedemptions", () => {
    //* Arrange
    const code = { active: true, currentRedemptions: 6, expiresAt: null, maxRedemptions: 5 };

    //* Act
    const result = getCodeStatus(code);

    //* Assert
    expect(result).toBe("exhausted");
  });

  it("returns 'active' when expiresAt is in the future", () => {
    //* Arrange
    const code = { active: true, currentRedemptions: 0, expiresAt: new Date("2099-01-01"), maxRedemptions: null };

    //* Act
    const result = getCodeStatus(code);

    //* Assert
    expect(result).toBe("active");
  });

  it("returns 'active' when redemptions are below max", () => {
    //* Arrange
    const code = { active: true, currentRedemptions: 3, expiresAt: null, maxRedemptions: 5 };

    //* Act
    const result = getCodeStatus(code);

    //* Assert
    expect(result).toBe("active");
  });

  it("prioritizes 'deactivated' over 'expired'", () => {
    //* Arrange
    const code = { active: false, currentRedemptions: 0, expiresAt: new Date("2020-01-01"), maxRedemptions: null };

    //* Act
    const result = getCodeStatus(code);

    //* Assert
    expect(result).toBe("deactivated");
  });

  it("prioritizes 'deactivated' over 'exhausted'", () => {
    //* Arrange
    const code = { active: false, currentRedemptions: 5, expiresAt: null, maxRedemptions: 5 };

    //* Act
    const result = getCodeStatus(code);

    //* Assert
    expect(result).toBe("deactivated");
  });

  it("prioritizes 'expired' over 'exhausted'", () => {
    //* Arrange
    const code = {
      active: true,
      currentRedemptions: 5,
      expiresAt: new Date("2020-01-01"),
      maxRedemptions: 5,
    };

    //* Act
    const result = getCodeStatus(code);

    //* Assert
    expect(result).toBe("expired");
  });
});
