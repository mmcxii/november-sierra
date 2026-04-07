import type { ApiKeyUser } from "@/lib/api/auth";
import { describe, expect, it, vi } from "vitest";
import { createMcpServer } from "../server";

vi.mock("@/lib/db/client", () => ({ db: {} }));
vi.mock("@/lib/env", () => ({
  envSchema: { NEXT_PUBLIC_APP_URL: "https://anchr.to" },
}));

const PRO_USER: ApiKeyUser = { id: "user-1", tier: "pro", username: "prouser" };
const FREE_USER: ApiKeyUser = { id: "user-2", tier: "free", username: "freeuser" };

function getToolDescription(user: ApiKeyUser, toolName: string): string {
  const server = createMcpServer(user);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tool = (server as any)._registeredTools[toolName];
  return tool?.description ?? "";
}

describe("tier-based tool descriptions", () => {
  describe("create_link", () => {
    it("omits free tier limit for Pro users", () => {
      //* Act
      const desc = getToolDescription(PRO_USER, "create_link");

      //* Assert
      expect(desc).not.toContain("Free tier");
      expect(desc).not.toContain("limited to");
    });

    it("includes free tier limit for free users", () => {
      //* Act
      const desc = getToolDescription(FREE_USER, "create_link");

      //* Assert
      expect(desc).toContain("Free tier");
      expect(desc).toContain("5 links");
    });
  });

  describe("toggle_featured_link", () => {
    it("describes feature behavior for Pro users", () => {
      //* Act
      const desc = getToolDescription(PRO_USER, "toggle_featured_link");

      //* Assert
      expect(desc).toContain("automatically unfeatures");
    });

    it("notes Pro requirement for free users", () => {
      //* Act
      const desc = getToolDescription(FREE_USER, "toggle_featured_link");

      //* Assert
      expect(desc).toContain("Requires a Pro subscription");
    });
  });

  describe("Pro-gated tools", () => {
    const proGatedTools = [
      "list_groups",
      "create_group",
      "update_group",
      "delete_group",
      "get_analytics",
      "get_link_analytics",
      "get_referrer_analytics",
      "get_device_analytics",
      "get_click_history",
    ];

    it("omits Pro note for Pro users", () => {
      for (const tool of proGatedTools) {
        //* Act
        const desc = getToolDescription(PRO_USER, tool);

        //* Assert
        expect(desc).not.toContain("Requires a Pro subscription");
      }
    });

    it("appends Pro note for free users", () => {
      for (const tool of proGatedTools) {
        //* Act
        const desc = getToolDescription(FREE_USER, tool);

        //* Assert
        expect(desc).toContain("Requires a Pro subscription");
      }
    });
  });
});
