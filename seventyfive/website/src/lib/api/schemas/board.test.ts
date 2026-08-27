import { describe, expect, it } from "vitest";
import { boardQuerySchema } from "./board";

describe("boardQuerySchema", () => {
  it("accepts a missing date", () => {
    //* Act
    const parsed = boardQuerySchema.safeParse({});

    //* Assert
    expect(parsed.success).toBe(true);
  });

  it("rejects a non-ISO date", () => {
    //* Act
    const parsed = boardQuerySchema.safeParse({ date: "08-27-2026" });

    //* Assert
    expect(parsed.success).toBe(false);
  });
});
