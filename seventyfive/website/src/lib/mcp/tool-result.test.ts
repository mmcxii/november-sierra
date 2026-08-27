import { describe, expect, it } from "vitest";
import { toToolResult } from "./tool-result";

describe("toToolResult", () => {
  it("serializes successful data as JSON text", () => {
    //* Act
    const result = toToolResult({ data: { ok: true }, error: null });

    //* Assert
    expect(result.isError).toBeUndefined();
    expect(result.content[0]).toEqual({ text: '{"ok":true}', type: "text" });
  });

  it("marks service errors as tool errors", () => {
    //* Act
    const result = toToolResult({ data: null, error: { code: "NOT_FOUND", message: "Team not found." } });

    //* Assert
    expect(result.isError).toBe(true);
    expect(result.content[0]).toEqual({
      text: '{"code":"NOT_FOUND","message":"Team not found."}',
      type: "text",
    });
  });
});
