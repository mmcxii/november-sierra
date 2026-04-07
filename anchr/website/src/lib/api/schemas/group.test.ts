import { describe, expect, it } from "vitest";
import { createGroupSchema, reorderGroupsSchema, updateGroupSchema } from "./group";

describe("createGroupSchema", () => {
  it("accepts valid input", () => {
    //* Act
    const result = createGroupSchema.safeParse({ title: "My Group" });

    //* Assert
    expect(result.success).toBe(true);
  });

  it("accepts optional slug", () => {
    //* Act
    const result = createGroupSchema.safeParse({ slug: "my-group", title: "My Group" });

    //* Assert
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    //* Act
    const result = createGroupSchema.safeParse({ title: "" });

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug", () => {
    //* Act
    const result = createGroupSchema.safeParse({ slug: "BAD SLUG!", title: "Test" });

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects unknown fields (strict)", () => {
    //* Act
    const result = createGroupSchema.safeParse({ extra: true, title: "Test" });

    //* Assert
    expect(result.success).toBe(false);
  });
});

describe("updateGroupSchema", () => {
  it("accepts partial update", () => {
    //* Act
    const result = updateGroupSchema.safeParse({ title: "Updated" });

    //* Assert
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    //* Act
    const result = updateGroupSchema.safeParse({});

    //* Assert
    expect(result.success).toBe(true);
  });
});

describe("reorderGroupsSchema", () => {
  it("accepts valid reorder items", () => {
    //* Act
    const result = reorderGroupsSchema.safeParse({
      items: [{ id: "a", position: 0 }],
    });

    //* Assert
    expect(result.success).toBe(true);
  });

  it("rejects empty items", () => {
    //* Act
    const result = reorderGroupsSchema.safeParse({ items: [] });

    //* Assert
    expect(result.success).toBe(false);
  });
});
