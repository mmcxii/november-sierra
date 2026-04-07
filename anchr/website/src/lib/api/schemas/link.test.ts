import { describe, expect, it } from "vitest";
import {
  bulkDeleteLinksSchema,
  bulkVisibilitySchema,
  createLinkSchema,
  reorderLinksSchema,
  updateLinkSchema,
} from "./link";

describe("createLinkSchema", () => {
  it("accepts valid input", () => {
    //* Act
    const result = createLinkSchema.safeParse({ title: "GitHub", url: "https://github.com" });

    //* Assert
    expect(result.success).toBe(true);
  });

  it("accepts optional fields", () => {
    //* Act
    const result = createLinkSchema.safeParse({
      groupId: "group-1",
      slug: "my-github",
      title: "GitHub",
      url: "https://github.com",
    });

    //* Assert
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    //* Act
    const result = createLinkSchema.safeParse({ title: "", url: "https://github.com" });

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects missing url", () => {
    //* Act
    const result = createLinkSchema.safeParse({ title: "GitHub" });

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug characters", () => {
    //* Act
    const result = createLinkSchema.safeParse({ slug: "My Slug!", title: "Test", url: "https://test.com" });

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects unknown fields (strict)", () => {
    //* Act
    const result = createLinkSchema.safeParse({ extra: true, title: "Test", url: "https://test.com" });

    //* Assert
    expect(result.success).toBe(false);
  });
});

describe("updateLinkSchema", () => {
  it("accepts partial update", () => {
    //* Act
    const result = updateLinkSchema.safeParse({ title: "Updated" });

    //* Assert
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    //* Act
    const result = updateLinkSchema.safeParse({});

    //* Assert
    expect(result.success).toBe(true);
  });

  it("accepts nullable groupId", () => {
    //* Act
    const result = updateLinkSchema.safeParse({ groupId: null });

    //* Assert
    expect(result.success).toBe(true);
  });
});

describe("reorderLinksSchema", () => {
  it("accepts valid reorder items", () => {
    //* Act
    const result = reorderLinksSchema.safeParse({
      items: [
        { id: "a", position: 0 },
        { id: "b", position: 1 },
      ],
    });

    //* Assert
    expect(result.success).toBe(true);
  });

  it("rejects empty items array", () => {
    //* Act
    const result = reorderLinksSchema.safeParse({ items: [] });

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects negative positions", () => {
    //* Act
    const result = reorderLinksSchema.safeParse({ items: [{ id: "a", position: -1 }] });

    //* Assert
    expect(result.success).toBe(false);
  });
});

describe("bulkDeleteLinksSchema", () => {
  it("accepts valid ids", () => {
    //* Act
    const result = bulkDeleteLinksSchema.safeParse({ ids: ["a", "b"] });

    //* Assert
    expect(result.success).toBe(true);
  });

  it("rejects empty ids", () => {
    //* Act
    const result = bulkDeleteLinksSchema.safeParse({ ids: [] });

    //* Assert
    expect(result.success).toBe(false);
  });
});

describe("bulkVisibilitySchema", () => {
  it("accepts valid input", () => {
    //* Act
    const result = bulkVisibilitySchema.safeParse({ ids: ["a"], visible: true });

    //* Assert
    expect(result.success).toBe(true);
  });

  it("rejects missing visible", () => {
    //* Act
    const result = bulkVisibilitySchema.safeParse({ ids: ["a"] });

    //* Assert
    expect(result.success).toBe(false);
  });
});
