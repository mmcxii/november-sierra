import { describe, expect, it, vi } from "vitest";
import { generateUsername } from "./utils";

describe("generateUsername", () => {
  it("generates from email when name is null", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.042);
    expect(generateUsername("sailor@example.com", null)).toBe("sailor042");
    vi.restoreAllMocks();
  });

  it("generates from display name when provided", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.123);
    expect(generateUsername("ignored@example.com", "John Doe")).toBe("johndoe123");
    vi.restoreAllMocks();
  });

  it("strips non-alphanumeric characters from name", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(generateUsername("x@x.com", "O'Brien-Smith")).toBe("obriensmith000");
    vi.restoreAllMocks();
  });

  it("strips non-alphanumeric characters from email local part", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(generateUsername("hello.world+test@example.com", null)).toBe("helloworldtest000");
    vi.restoreAllMocks();
  });

  it("pads suffix to 3 digits", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.005);
    expect(generateUsername("user@test.com", null)).toBe("user005");
    vi.restoreAllMocks();
  });

  it("handles empty email local part", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(generateUsername("@example.com", null)).toBe("500");
    vi.restoreAllMocks();
  });
});
