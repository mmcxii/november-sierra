import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/client", () => ({ db: {} }));
vi.mock("@/lib/stripe", () => ({ stripe: {} }));
vi.mock("@/lib/vercel", () => ({ removeDomain: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ clerkClient: vi.fn() }));
vi.mock("uploadthing/server", () => ({ UTApi: vi.fn() }));

const { extractFileKey } = await import("./account-deletion");

describe("extractFileKey", () => {
  it("extracts key from utfs.io URL", () => {
    //* Act
    const result = extractFileKey("https://utfs.io/f/abc123");

    //* Assert
    expect(result).toBe("abc123");
  });

  it("extracts key from app-specific ufs.sh URL", () => {
    //* Act
    const result = extractFileKey("https://myapp.ufs.sh/f/def456");

    //* Assert
    expect(result).toBe("def456");
  });

  it("returns null for URL without /f/ segment", () => {
    //* Act
    const result = extractFileKey("https://utfs.io/images/abc123");

    //* Assert
    expect(result).toBeNull();
  });

  it("returns null for URL where /f/ is the last segment", () => {
    //* Act
    const result = extractFileKey("https://utfs.io/f/");

    //* Assert
    expect(result).toBeNull();
  });

  it("returns null for invalid URL", () => {
    //* Act
    const result = extractFileKey("not-a-url");

    //* Assert
    expect(result).toBeNull();
  });

  it("returns null for empty string", () => {
    //* Act
    const result = extractFileKey("");

    //* Assert
    expect(result).toBeNull();
  });

  it("handles URL with nested /f/ path", () => {
    //* Act
    const result = extractFileKey("https://utfs.io/a/appid/f/key789");

    //* Assert
    expect(result).toBe("key789");
  });
});
