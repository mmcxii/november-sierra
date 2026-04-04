import { serviceError, serviceSuccess } from "@/lib/services/types";
import { describe, expect, it } from "vitest";
import { toToolResult } from "./tool-result";

describe("toToolResult", () => {
  it("converts successful result to MCP tool result", () => {
    //* Arrange
    const result = serviceSuccess({ id: "1", title: "My Link" });

    //* Act
    const toolResult = toToolResult(result);

    //* Assert
    expect(toolResult.isError).toBeUndefined();
    expect(toolResult.content).toHaveLength(1);
    expect(toolResult.content[0]).toEqual({
      text: JSON.stringify({ id: "1", title: "My Link" }),
      type: "text",
    });
  });

  it("converts error result to MCP tool error", () => {
    //* Arrange
    const result = serviceError("NOT_FOUND", "Link not found.", 404);

    //* Act
    const toolResult = toToolResult(result);

    //* Assert
    expect(toolResult.isError).toBe(true);
    expect(toolResult.content).toHaveLength(1);
    expect(toolResult.content[0]).toEqual({
      text: JSON.stringify({ code: "NOT_FOUND", message: "Link not found." }),
      type: "text",
    });
  });

  it("handles null data in successful result", () => {
    //* Arrange
    const result = serviceSuccess(null);

    //* Act
    const toolResult = toToolResult(result);

    //* Assert
    expect(toolResult.isError).toBeUndefined();
    expect((toolResult.content[0] as { text: string }).text).toBe("null");
  });
});
