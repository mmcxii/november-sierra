import { describe, expect, it } from "vitest";
import { patchTaskBodySchema } from "./task";

describe("patchTaskBodySchema", () => {
  it("requires checked", () => {
    //* Act
    const parsed = patchTaskBodySchema.safeParse({});

    //* Assert
    expect(parsed.success).toBe(false);
  });

  it("accepts checked with optional date", () => {
    //* Act
    const parsed = patchTaskBodySchema.safeParse({ checked: true, date: "2026-08-27" });

    //* Assert
    expect(parsed.success).toBe(true);
  });
});
