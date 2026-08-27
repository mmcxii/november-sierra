import { listTeams } from "@/lib/mcp/services/teams";
import { toToolResult } from "@/lib/mcp/tool-result";
import type { McpUser } from "@/lib/mcp/types";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerTeamTools(server: McpServer, user: McpUser): void {
  server.registerTool(
    "list_teams",
    {
      annotations: { readOnlyHint: true },
      description:
        "List the authenticated user's SeventyFive teams, including challenge dates, Hard/Soft mode, status, and the member's local today.",
      title: "List teams",
    },
    async () => {
      const result = await listTeams(user);
      return toToolResult(result);
    },
  );
}
