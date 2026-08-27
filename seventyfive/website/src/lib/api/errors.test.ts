import { describe, expect, it } from "vitest";
import { API_ERROR_CODES } from "./errors";

describe("API_ERROR_CODES", () => {
  it("values match keys", () => {
    //* Act
    const entries = Object.entries(API_ERROR_CODES);

    //* Assert
    for (const [key, value] of entries) {
      expect(key).toBe(value);
    }
  });
});
