import { describe, expect, it, vi } from "vitest";
import { generateRandomSlug } from "./short-slug";

vi.mock("@/lib/db/client", () => ({ db: {} }));
vi.mock("@/lib/db/schema/short-slug", () => ({ shortSlugsTable: {} }));

const SAFE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
const AMBIGUOUS_CHARS = ["0", "O", "1", "l", "I"];

describe("generateRandomSlug", () => {
  it("generates a slug of the requested length", () => {
    //* Act
    const slug = generateRandomSlug(5);

    //* Assert
    expect(slug).toHaveLength(5);
  });

  it("generates a slug of length 7", () => {
    //* Act
    const slug = generateRandomSlug(7);

    //* Assert
    expect(slug).toHaveLength(7);
  });

  it("only contains characters from the safe alphabet", () => {
    //* Act
    const slugs = Array.from({ length: 100 }, () => {
      return generateRandomSlug(6);
    });

    //* Assert
    for (const slug of slugs) {
      for (const char of slug) {
        expect(SAFE_ALPHABET).toContain(char);
      }
    }
  });

  it("never contains ambiguous characters", () => {
    //* Act
    const slugs = Array.from({ length: 200 }, () => {
      return generateRandomSlug(8);
    });

    //* Assert
    for (const slug of slugs) {
      for (const char of AMBIGUOUS_CHARS) {
        expect(slug).not.toContain(char);
      }
    }
  });

  it("generates different slugs on consecutive calls", () => {
    //* Act
    const slugs = new Set<string>();
    for (let i = 0; i < 50; i++) {
      slugs.add(generateRandomSlug(6));
    }

    //* Assert
    // With 30^6 possible combinations, 50 slugs should all be unique
    expect(slugs.size).toBe(50);
  });
});
