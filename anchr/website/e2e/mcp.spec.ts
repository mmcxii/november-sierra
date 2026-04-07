import { type APIRequestContext, request as playwrightRequest } from "@playwright/test";
import { expect, test } from "./fixtures/auth";
import { createTestApiKey, deleteTestApiKeys } from "./fixtures/db";
import { testUsers } from "./fixtures/test-users";

// ---------- helpers ----------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RpcResult = any;

function createMcpClient(request: APIRequestContext, rawKey: string) {
  const headers = {
    Accept: "application/json, text/event-stream",
    Authorization: `Bearer ${rawKey}`,
    "Content-Type": "application/json",
  };
  let nextId = 1;

  async function rpc(method: string, params: unknown): Promise<RpcResult> {
    const response = await request.post("/api/v1/mcp", {
      data: { id: nextId++, jsonrpc: "2.0", method, params },
      headers,
    });
    expect(response.status()).toBe(200);
    return response.json();
  }

  async function initialize() {
    return rpc("initialize", {
      capabilities: {},
      clientInfo: { name: "e2e-test", version: "1.0.0" },
      protocolVersion: "2025-03-26",
    });
  }

  async function callToolRaw(name: string, args: unknown): Promise<RpcResult> {
    const body = await rpc("tools/call", { arguments: args, name });
    return body.result;
  }

  async function callTool(name: string, args: unknown): Promise<RpcResult> {
    const result = await callToolRaw(name, args);
    expect(result.isError, `${name} returned error: ${result.content?.[0]?.text}`).toBeFalsy();
    return JSON.parse(result.content[0].text);
  }

  function parseError(result: RpcResult): { code: string; message: string } {
    return JSON.parse(result.content[0].text);
  }

  return { callTool, callToolRaw, headers, initialize, parseError, rpc };
}

// ---------- tests ----------

test.describe("MCP server", () => {
  test.describe.configure({ mode: "serial" });

  let apiRequest: APIRequestContext;
  let mcp: ReturnType<typeof createMcpClient>;

  test.beforeAll(async () => {
    apiRequest = await playwrightRequest.newContext({
      baseURL: "http://localhost:3000",
    });
    const rawKey = await createTestApiKey(testUsers.pro.username);
    mcp = createMcpClient(apiRequest, rawKey);
    await mcp.initialize();
  });

  test.afterAll(async () => {
    await deleteTestApiKeys(testUsers.pro.username);
    await apiRequest.dispose();
  });

  // ---- profile ----

  test("get_profile returns the authenticated user's profile", async () => {
    //* Act
    const profile = await mcp.callTool("get_profile", {});

    //* Assert
    expect(profile.username).toBe(testUsers.pro.username);
    expect(profile.tier).toBe("pro");
    expect(profile.profileUrl).toBeDefined();
    expect(typeof profile.linkCount).toBe("number");
  });

  test("update_profile changes display name and bio", async () => {
    //* Act
    const updated = await mcp.callTool("update_profile", {
      bio: "E2E bio",
      displayName: "E2E Display Name",
    });

    //* Assert
    expect(updated.displayName).toBe("E2E Display Name");
    expect(updated.bio).toBe("E2E bio");

    //* Cleanup — reset
    await mcp.callTool("update_profile", { bio: "", displayName: "" });
  });

  test("update_profile rejects empty update", async () => {
    //* Act
    const result = await mcp.callToolRaw("update_profile", {});

    //* Assert
    expect(result.isError).toBe(true);
    const err = mcp.parseError(result);
    expect(err.code).toBe("VALIDATION_ERROR");
  });

  test("update_theme changes page themes", async () => {
    //* Act
    const updated = await mcp.callTool("update_theme", {
      pageDarkTheme: "obsidian",
      pageLightTheme: "stateroom",
    });

    //* Assert
    expect(updated.pageDarkTheme).toBe("obsidian");
    expect(updated.pageLightTheme).toBe("stateroom");

    //* Cleanup — reset to defaults
    await mcp.callTool("update_theme", {
      pageDarkTheme: "dark-depths",
      pageLightTheme: "stateroom",
    });
  });

  test("update_theme rejects invalid theme ID", async () => {
    //* Act
    const result = await mcp.callToolRaw("update_theme", {
      pageDarkTheme: "nonexistent-theme",
    });

    //* Assert
    expect(result.isError).toBe(true);
    const err = mcp.parseError(result);
    expect(err.code).toBe("VALIDATION_ERROR");
  });

  // ---- links ----

  let createdLinkId: string;
  let createdLinkSlug: string;

  test("create_link creates a link and returns it", async () => {
    //* Act
    const link = await mcp.callTool("create_link", {
      title: "MCP E2E Link",
      url: "https://www.google.com",
    });

    //* Assert
    expect(link.title).toBe("MCP E2E Link");
    expect(link.url).toBe("https://www.google.com");
    expect(link.id).toBeDefined();
    expect(link.slug).toBeDefined();
    expect(link.visible).toBe(true);

    createdLinkId = link.id;
    createdLinkSlug = link.slug;
  });

  test("list_links includes the created link", async () => {
    //* Act
    const links = await mcp.callTool("list_links", {});

    //* Assert
    const found = links.find((l: { id: string }) => l.id === createdLinkId);
    expect(found).toBeDefined();
    expect(found.title).toBe("MCP E2E Link");
  });

  test("update_link changes title and slug", async () => {
    //* Act
    const updated = await mcp.callTool("update_link", {
      id: createdLinkId,
      slug: `${createdLinkSlug}-edited`,
      title: "MCP E2E Link Edited",
    });

    //* Assert
    expect(updated.title).toBe("MCP E2E Link Edited");
    expect(updated.slug).toBe(`${createdLinkSlug}-edited`);
  });

  test("toggle_link_visibility hides and shows a link", async () => {
    //* Act — hide
    const hidden = await mcp.callTool("toggle_link_visibility", { id: createdLinkId });

    //* Assert
    expect(hidden.visible).toBe(false);

    //* Act — show
    const shown = await mcp.callTool("toggle_link_visibility", { id: createdLinkId });

    //* Assert
    expect(shown.visible).toBe(true);
  });

  test("toggle_featured_link features and unfeatures a link", async () => {
    //* Act — feature
    const featured = await mcp.callTool("toggle_featured_link", { id: createdLinkId });

    //* Assert
    expect(featured.isFeatured).toBe(true);

    //* Act — unfeature
    const unfeatured = await mcp.callTool("toggle_featured_link", { id: createdLinkId });

    //* Assert
    expect(unfeatured.isFeatured).toBe(false);
  });

  test("create_link rejects duplicate slug", async () => {
    //* Act
    const result = await mcp.callToolRaw("create_link", {
      slug: `${createdLinkSlug}-edited`,
      title: "Dupe Slug",
      url: "https://www.google.com",
    });

    //* Assert
    expect(result.isError).toBe(true);
    const err = mcp.parseError(result);
    expect(err.code).toBe("PATH_ALREADY_IN_USE");
  });

  // Create a second link so we can test reorder with 2 items
  let secondLinkId: string;

  test("reorder_links changes link positions", async () => {
    //* Arrange — create a second link
    const second = await mcp.callTool("create_link", {
      title: "MCP E2E Link 2",
      url: "https://www.google.com",
    });
    secondLinkId = second.id;

    //* Act — swap positions
    await mcp.callTool("reorder_links", {
      items: [
        { id: createdLinkId, position: 1 },
        { id: secondLinkId, position: 0 },
      ],
    });

    //* Assert — verify new order
    const links = await mcp.callTool("list_links", {});
    const positions = links.reduce(
      (acc: Record<string, number>, l: { id: string; position: number }) => {
        acc[l.id] = l.position;
        return acc;
      },
      {} as Record<string, number>,
    );
    expect(positions[createdLinkId]).toBe(1);
    expect(positions[secondLinkId]).toBe(0);
  });

  test("delete_link removes links", async () => {
    //* Act
    const r1 = await mcp.callToolRaw("delete_link", { id: createdLinkId });
    const r2 = await mcp.callToolRaw("delete_link", { id: secondLinkId });

    //* Assert
    expect(r1.isError).toBeFalsy();
    expect(r2.isError).toBeFalsy();

    //* Verify — gone from list
    const links = await mcp.callTool("list_links", {});
    const ids = links.map((l: { id: string }) => l.id);
    expect(ids).not.toContain(createdLinkId);
    expect(ids).not.toContain(secondLinkId);
  });

  test("delete_link returns NOT_FOUND for nonexistent link", async () => {
    //* Act
    const result = await mcp.callToolRaw("delete_link", { id: "nonexistent-id" });

    //* Assert
    expect(result.isError).toBe(true);
    const err = mcp.parseError(result);
    expect(err.code).toBe("NOT_FOUND");
  });

  // ---- groups ----

  let createdGroupId: string;

  test("create_group creates a group", async () => {
    //* Act
    const group = await mcp.callTool("create_group", { title: "MCP E2E Group" });

    //* Assert
    expect(group.title).toBe("MCP E2E Group");
    expect(group.id).toBeDefined();
    expect(group.slug).toBeDefined();
    expect(group.isQuickLinks).toBe(false);

    createdGroupId = group.id;
  });

  test("list_groups includes the created group", async () => {
    //* Act
    const groups = await mcp.callTool("list_groups", {});

    //* Assert
    const found = groups.find((g: { id: string }) => g.id === createdGroupId);
    expect(found).toBeDefined();
    expect(found.title).toBe("MCP E2E Group");
  });

  test("update_group changes the group title", async () => {
    //* Act
    const updated = await mcp.callTool("update_group", {
      id: createdGroupId,
      title: "MCP E2E Group Edited",
    });

    //* Assert
    expect(updated.title).toBe("MCP E2E Group Edited");
  });

  test("update_group rejects modifying QuickLinks", async () => {
    //* Arrange — find the QuickLinks group
    const groups = await mcp.callTool("list_groups", {});
    const quickLinks = groups.find((g: { isQuickLinks: boolean }) => g.isQuickLinks);

    //* Act
    const result = await mcp.callToolRaw("update_group", {
      id: quickLinks.id,
      title: "Renamed",
    });

    //* Assert
    expect(result.isError).toBe(true);
    const err = mcp.parseError(result);
    expect(err.code).toBe("FORBIDDEN");
  });

  test("create_link with groupId assigns link to group", async () => {
    //* Act
    const link = await mcp.callTool("create_link", {
      groupId: createdGroupId,
      title: "Grouped Link",
      url: "https://www.google.com",
    });

    //* Assert
    expect(link.groupId).toBe(createdGroupId);

    //* Cleanup
    await mcp.callToolRaw("delete_link", { id: link.id });
  });

  test("delete_group removes the group", async () => {
    //* Act
    const result = await mcp.callToolRaw("delete_group", { id: createdGroupId });

    //* Assert
    expect(result.isError).toBeFalsy();

    //* Verify — gone from list
    const groups = await mcp.callTool("list_groups", {});
    const ids = groups.map((g: { id: string }) => g.id);
    expect(ids).not.toContain(createdGroupId);
  });

  test("delete_group rejects deleting QuickLinks", async () => {
    //* Arrange
    const groups = await mcp.callTool("list_groups", {});
    const quickLinks = groups.find((g: { isQuickLinks: boolean }) => g.isQuickLinks);

    //* Act
    const result = await mcp.callToolRaw("delete_group", { id: quickLinks.id });

    //* Assert
    expect(result.isError).toBe(true);
    const err = mcp.parseError(result);
    expect(err.code).toBe("FORBIDDEN");
  });

  // ---- analytics ----

  test("get_analytics returns summary data", async () => {
    //* Act
    const analytics = await mcp.callTool("get_analytics", {});

    //* Assert
    expect(typeof analytics.totalClicks).toBe("number");
    expect(analytics).toHaveProperty("topLink");
    expect(analytics).toHaveProperty("topCountry");
  });

  test("get_link_analytics returns per-link click data", async () => {
    //* Act
    const data = await mcp.callTool("get_link_analytics", {});

    //* Assert
    expect(Array.isArray(data)).toBe(true);
  });

  test("get_referrer_analytics returns referrer data", async () => {
    //* Act
    const data = await mcp.callTool("get_referrer_analytics", {});

    //* Assert
    expect(Array.isArray(data)).toBe(true);
  });

  test("get_device_analytics returns browser/device/os data", async () => {
    //* Act
    const data = await mcp.callTool("get_device_analytics", {});

    //* Assert
    expect(data).toHaveProperty("browsers");
    expect(data).toHaveProperty("devices");
    expect(data).toHaveProperty("operatingSystems");
  });

  test("get_click_history returns time-series data", async () => {
    //* Act
    const data = await mcp.callTool("get_click_history", {});

    //* Assert
    expect(Array.isArray(data)).toBe(true);
  });

  // ---- discovery ----

  test("lookup_profile returns public profile for existing user", async () => {
    //* Act
    const profile = await mcp.callTool("lookup_profile", {
      username: testUsers.pro.username,
    });

    //* Assert
    expect(profile.username).toBe(testUsers.pro.username);
    expect(profile).toHaveProperty("links");
    expect(profile).toHaveProperty("profileUrl");
  });

  test("lookup_profile returns NOT_FOUND for nonexistent user", async () => {
    //* Act
    const result = await mcp.callToolRaw("lookup_profile", {
      username: "definitely-not-a-real-user-abc123",
    });

    //* Assert
    expect(result.isError).toBe(true);
    const err = mcp.parseError(result);
    expect(err.code).toBe("NOT_FOUND");
  });
});

// ---- free-tier gating (separate describe, different user) ----

test.describe("MCP server — free-tier gating", () => {
  test("returns 403 PRO_REQUIRED for free-tier user", async ({ request }) => {
    //* Arrange
    const rawKey = await createTestApiKey(testUsers.admin.username);

    try {
      //* Act — free-tier users are rejected at the route level (before MCP transport)
      const response = await request.post("/api/v1/mcp", {
        data: {
          id: 1,
          jsonrpc: "2.0",
          method: "initialize",
          params: {
            capabilities: {},
            clientInfo: { name: "e2e-test", version: "1.0.0" },
            protocolVersion: "2025-03-26",
          },
        },
        headers: {
          Accept: "application/json, text/event-stream",
          Authorization: `Bearer ${rawKey}`,
          "Content-Type": "application/json",
        },
      });

      //* Assert
      expect(response.status()).toBe(403);
      const body = await response.json();
      expect(body.error.code).toBe("PRO_REQUIRED");
    } finally {
      //* Cleanup
      await deleteTestApiKeys(testUsers.admin.username);
    }
  });
});
