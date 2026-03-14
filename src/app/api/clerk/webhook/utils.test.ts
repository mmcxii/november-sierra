import { describe, expect, it, vi } from "vitest";
import { generateUsername } from "./utils";

describe("generateUsername", () => {
  it("generates from email when name is null", () => {
    //* Arrange
    vi.spyOn(Math, "random").mockReturnValue(0.042);

    //* Act
    const result = generateUsername("sailor@example.com", null);

    //* Assert
    expect(result).toBe("sailor042");
    vi.restoreAllMocks();
  });

  it("generates from display name when provided", () => {
    //* Arrange
    vi.spyOn(Math, "random").mockReturnValue(0.123);

    //* Act
    const result = generateUsername("ignored@example.com", "John Doe");

    //* Assert
    expect(result).toBe("johndoe123");
    vi.restoreAllMocks();
  });

  it("strips non-alphanumeric characters from name", () => {
    //* Arrange
    vi.spyOn(Math, "random").mockReturnValue(0);

    //* Act
    const result = generateUsername("x@x.com", "O'Brien-Smith");

    //* Assert
    expect(result).toBe("obriensmith000");
    vi.restoreAllMocks();
  });

  it("strips non-alphanumeric characters from email local part", () => {
    //* Arrange
    vi.spyOn(Math, "random").mockReturnValue(0);

    //* Act
    const result = generateUsername("hello.world+test@example.com", null);

    //* Assert
    expect(result).toBe("helloworldtest000");
    vi.restoreAllMocks();
  });

  it("pads suffix to 3 digits", () => {
    //* Arrange
    vi.spyOn(Math, "random").mockReturnValue(0.005);

    //* Act
    const result = generateUsername("user@test.com", null);

    //* Assert
    expect(result).toBe("user005");
    vi.restoreAllMocks();
  });

  it("handles empty email local part", () => {
    //* Arrange
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    //* Act
    const result = generateUsername("@example.com", null);

    //* Assert
    expect(result).toBe("500");
    vi.restoreAllMocks();
  });
});
