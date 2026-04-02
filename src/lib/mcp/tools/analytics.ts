import type { ApiKeyUser } from "@/lib/api/auth";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getAnalytics,
  getClickHistory,
  getDeviceAnalytics,
  getLinkAnalytics,
  getReferrerAnalytics,
} from "../services/analytics";
import { toToolResult } from "../tool-result";

const dateRangeSchema = {
  end: z.string().optional().describe("End date (YYYY-MM-DD). Defaults to today."),
  start: z.string().optional().describe("Start date (YYYY-MM-DD). Defaults to all time."),
};

export function registerAnalyticsTools(server: McpServer, user: ApiKeyUser): void {
  const proNote = user.tier === "pro" ? "" : " Requires a Pro subscription.";

  server.registerTool(
    "get_analytics",
    {
      annotations: { readOnlyHint: true },
      description: `Get a click analytics summary: total clicks, top link, and top country. Supports optional date range filtering.${proNote}`,
      inputSchema: dateRangeSchema,
      title: "Get Analytics",
    },
    async ({ end, start }) => {
      const result = await getAnalytics(user, { end, start });
      return toToolResult(result);
    },
  );

  server.registerTool(
    "get_link_analytics",
    {
      annotations: { readOnlyHint: true },
      description: `Get per-link click breakdown showing clicks per link, ordered by most clicked.${proNote}`,
      inputSchema: dateRangeSchema,
      title: "Get Link Analytics",
    },
    async ({ end, start }) => {
      const result = await getLinkAnalytics(user, { end, start });
      return toToolResult(result);
    },
  );

  server.registerTool(
    "get_referrer_analytics",
    {
      annotations: { readOnlyHint: true },
      description: `Get referrer data showing where clicks are coming from, ordered by volume.${proNote}`,
      inputSchema: dateRangeSchema,
      title: "Get Referrer Analytics",
    },
    async ({ end, start }) => {
      const result = await getReferrerAnalytics(user, { end, start });
      return toToolResult(result);
    },
  );

  server.registerTool(
    "get_device_analytics",
    {
      annotations: { readOnlyHint: true },
      description: `Get device, browser, and operating system breakdown for clicks.${proNote}`,
      inputSchema: dateRangeSchema,
      title: "Get Device Analytics",
    },
    async ({ end, start }) => {
      const result = await getDeviceAnalytics(user, { end, start });
      return toToolResult(result);
    },
  );

  server.registerTool(
    "get_click_history",
    {
      annotations: { readOnlyHint: true },
      description: `Get time-series click history grouped by date (YYYY-MM-DD), ordered chronologically.${proNote}`,
      inputSchema: dateRangeSchema,
      title: "Get Click History",
    },
    async ({ end, start }) => {
      const result = await getClickHistory(user, { end, start });
      return toToolResult(result);
    },
  );
}
