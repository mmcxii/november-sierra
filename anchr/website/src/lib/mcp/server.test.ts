import type { ApiKeyUser } from "@/lib/api/auth";
import { describe, expect, it, vi } from "vitest";
import { createMcpServer } from "./server";

vi.mock("@/lib/db/client", () => ({ db: {} }));
vi.mock("@/lib/env", () => ({
  envSchema: { NEXT_PUBLIC_APP_URL: "https://anchr.to", NEXT_PUBLIC_SHORT_DOMAIN: "test.short.domain" },
}));

const PRO_USER: ApiKeyUser = { id: "user-1", tier: "pro", username: "testuser" };
const FREE_USER: ApiKeyUser = { id: "user-2", tier: "free", username: "freeuser" };

const ALL_TOOL_NAMES = [
  "get_profile",
  "update_profile",
  "update_theme",
  "list_links",
  "create_link",
  "update_link",
  "delete_link",
  "reorder_links",
  "toggle_link_visibility",
  "toggle_featured_link",
  "list_groups",
  "create_group",
  "update_group",
  "delete_group",
  "list_short_links",
  "create_short_link",
  "update_short_link",
  "delete_short_link",
  "get_analytics",
  "get_link_analytics",
  "get_referrer_analytics",
  "get_device_analytics",
  "get_click_history",
  "lookup_profile",
];

describe("createMcpServer", () => {
  it("registers exactly the 24 expected tools", () => {
    //* Act
    const server = createMcpServer(PRO_USER);

    //* Assert
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolNames = Object.keys((server as any)._registeredTools);
    expect(toolNames).toHaveLength(ALL_TOOL_NAMES.length);

    for (const name of ALL_TOOL_NAMES) {
      expect(toolNames).toContain(name);
    }
  });

  it("registers the same tools for free and pro users", () => {
    //* Act
    const proServer = createMcpServer(PRO_USER);
    const freeServer = createMcpServer(FREE_USER);

    //* Assert
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proTools = Object.keys((proServer as any)._registeredTools);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const freeTools = Object.keys((freeServer as any)._registeredTools);

    expect(proTools).toEqual(freeTools);
  });
});
