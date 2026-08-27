import type { McpUser } from "@/lib/mcp/types";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/client", () => {
  return { db: {} };
});
vi.mock("@/lib/env", () => {
  return {
    envSchema: {
      DATABASE_URL: "postgres://localhost/sf",
      NEXT_PUBLIC_APP_URL: "https://seventyfive.team",
      SESSION_SECRET: "s".repeat(32),
    },
    betterAuthSecret: () => {
      return "s".repeat(32);
    },
  };
});

const { createMcpServer } = await import("./server");

const USER: McpUser = { id: "user-1", timeZone: "America/New_York", username: "guy" };
const TOOL_NAMES = ["list_teams", "get_board", "set_task"];

describe("createMcpServer", () => {
  it("registers list_teams, get_board, and set_task", () => {
    //* Act
    const server = createMcpServer(USER);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolNames = Object.keys((server as any)._registeredTools);

    //* Assert
    expect(toolNames).toHaveLength(TOOL_NAMES.length);
    for (const name of TOOL_NAMES) {
      expect(toolNames).toContain(name);
    }
  });
});
