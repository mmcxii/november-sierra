import { setTask } from "@/lib/mcp/services/tasks";
import { toToolResult } from "@/lib/mcp/tool-result";
import type { McpUser } from "@/lib/mcp/types";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerTaskTools(server: McpServer, user: McpUser): void {
  server.registerTool(
    "set_task",
    {
      annotations: { readOnlyHint: false },
      description:
        "Check or uncheck one of your required tasks for a date (defaults to local today). Uses the same Hard fail / Soft edit rules as the team board. taskId values come from get_board.",
      inputSchema: {
        checked: z.boolean().describe("True to check the task, false to uncheck."),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe("Challenge calendar date YYYY-MM-DD. Defaults to the member's local today."),
        taskId: z
          .string()
          .min(1)
          .describe(
            "Task id from get_board, e.g. workout, water, diet, reading, alcohol, outdoorWorkout, progressPhoto.",
          ),
        teamId: z.string().min(1).describe("Team id from list_teams."),
      },
      title: "Set task",
    },
    async ({ checked, date, taskId, teamId }) => {
      const result = await setTask(user, { checked, date, taskId, teamId });
      return toToolResult(result);
    },
  );
}
