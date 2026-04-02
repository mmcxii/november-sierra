import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ServiceResult } from "./types";

export function toToolResult(result: ServiceResult<unknown>): CallToolResult {
  if (result.error != null) {
    return {
      content: [
        {
          text: JSON.stringify({ code: result.error.code, message: result.error.message }),
          type: "text",
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        text: JSON.stringify(result.data),
        type: "text",
      },
    ],
  };
}
