import { getBoard } from "@/lib/mcp/services/board";
import { toToolResult } from "@/lib/mcp/tool-result";
import type { McpUser } from "@/lib/mcp/types";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerBoardTools(server: McpServer, user: McpUser): void {
  server.registerTool(
    "get_board",
    {
      annotations: { readOnlyHint: true },
      description:
        "Get one team's board: your tasks for a date (defaults to local today), remaining work, personal progress, and the roster with each member's status and remaining tasks.",
      inputSchema: {
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe("Challenge calendar date YYYY-MM-DD. Defaults to the member's local today."),
        teamId: z.string().min(1).describe("Team id from list_teams."),
      },
      title: "Get board",
    },
    async ({ date, teamId }) => {
      const result = await getBoard(user, { date, teamId });
      return toToolResult(result);
    },
  );
}
