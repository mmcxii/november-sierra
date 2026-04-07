import { describe, expect, it } from "vitest";
import { API_ERROR_CODES } from "./errors";

describe("API_ERROR_CODES", () => {
  it("contains all expected error codes", () => {
    //* Act
    const codes = API_ERROR_CODES;

    //* Assert
    expect(codes.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(codes.FORBIDDEN).toBe("FORBIDDEN");
    expect(codes.NOT_FOUND).toBe("NOT_FOUND");
    expect(codes.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(codes.LINK_LIMIT_REACHED).toBe("LINK_LIMIT_REACHED");
    expect(codes.PRO_REQUIRED).toBe("PRO_REQUIRED");
    expect(codes.RATE_LIMIT_EXCEEDED).toBe("RATE_LIMIT_EXCEEDED");
    expect(codes.INVALID_API_KEY).toBe("INVALID_API_KEY");
    expect(codes.UNSAFE_URL).toBe("UNSAFE_URL");
    expect(codes.URL_UNREACHABLE).toBe("URL_UNREACHABLE");
    expect(codes.PATH_ALREADY_IN_USE).toBe("PATH_ALREADY_IN_USE");
    expect(codes.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
  });

  it("values match keys", () => {
    //* Act
    const entries = Object.entries(API_ERROR_CODES);

    //* Assert
    for (const [key, value] of entries) {
      expect(key).toBe(value);
    }
  });
});
