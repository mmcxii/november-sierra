import type { ServiceResult } from "@/lib/services/types";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

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
