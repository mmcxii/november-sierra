/**
 * MCP client → server integration tests.
 *
 * Wires a real MCP Client to a real McpServer via InMemoryTransport.
 * Services are mocked at the module boundary so tests verify:
 *   - Input schema validation (MCP SDK rejects invalid params before hitting service)
 *   - ServiceResult → CallToolResult conversion (success vs isError)
 *   - Edge cases: free tier limits, URL safety, slug conflicts, Pro gating
 */
import type { ApiKeyUser } from "@/lib/api/auth";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------- Service mocks ----------

const mockGetProfile = vi.fn();
const mockUpdateProfile = vi.fn();
const mockUpdateTheme = vi.fn();
vi.mock("@/lib/services/profile", () => ({
  getProfile: (...a: unknown[]) => {
    return mockGetProfile(...a);
  },
  updateProfile: (...a: unknown[]) => {
    return mockUpdateProfile(...a);
  },
  updateTheme: (...a: unknown[]) => {
    return mockUpdateTheme(...a);
  },
}));

const mockListLinks = vi.fn();
const mockCreateLink = vi.fn();
const mockUpdateLink = vi.fn();
const mockDeleteLink = vi.fn();
const mockReorderLinks = vi.fn();
const mockToggleLinkVisibility = vi.fn();
const mockToggleFeaturedLink = vi.fn();
vi.mock("@/lib/services/link", () => ({
  createLink: (...a: unknown[]) => {
    return mockCreateLink(...a);
  },
  deleteLink: (...a: unknown[]) => {
    return mockDeleteLink(...a);
  },
  listLinks: (...a: unknown[]) => {
    return mockListLinks(...a);
  },
  reorderLinks: (...a: unknown[]) => {
    return mockReorderLinks(...a);
  },
  toggleFeaturedLink: (...a: unknown[]) => {
    return mockToggleFeaturedLink(...a);
  },
  toggleLinkVisibility: (...a: unknown[]) => {
    return mockToggleLinkVisibility(...a);
  },
  updateLink: (...a: unknown[]) => {
    return mockUpdateLink(...a);
  },
}));

const mockListGroups = vi.fn();
const mockCreateGroup = vi.fn();
const mockUpdateGroup = vi.fn();
const mockDeleteGroup = vi.fn();
vi.mock("@/lib/services/group", () => ({
  createGroup: (...a: unknown[]) => {
    return mockCreateGroup(...a);
  },
  deleteGroup: (...a: unknown[]) => {
    return mockDeleteGroup(...a);
  },
  listGroups: (...a: unknown[]) => {
    return mockListGroups(...a);
  },
  updateGroup: (...a: unknown[]) => {
    return mockUpdateGroup(...a);
  },
}));

const mockGetAnalytics = vi.fn();
const mockGetLinkAnalytics = vi.fn();
const mockGetReferrerAnalytics = vi.fn();
const mockGetDeviceAnalytics = vi.fn();
const mockGetClickHistory = vi.fn();
vi.mock("@/lib/services/analytics", () => ({
  getAnalytics: (...a: unknown[]) => {
    return mockGetAnalytics(...a);
  },
  getClickHistory: (...a: unknown[]) => {
    return mockGetClickHistory(...a);
  },
  getDeviceAnalytics: (...a: unknown[]) => {
    return mockGetDeviceAnalytics(...a);
  },
  getLinkAnalytics: (...a: unknown[]) => {
    return mockGetLinkAnalytics(...a);
  },
  getReferrerAnalytics: (...a: unknown[]) => {
    return mockGetReferrerAnalytics(...a);
  },
}));

const mockLookupProfile = vi.fn();
vi.mock("@/lib/services/discovery", () => ({
  lookupProfile: (...a: unknown[]) => {
    return mockLookupProfile(...a);
  },
}));

// Still need these for tool registration (description generation)
vi.mock("@/lib/themes", () => ({
  DARK_THEME_ID_LIST: ["dark-depths", "midnight-glow"],
  LIGHT_THEME_ID_LIST: ["stateroom"],
  THEME_IDS: ["dark-depths", "midnight-glow", "stateroom"],
  isValidThemeId: (id: string) => {
    return ["dark-depths", "stateroom", "midnight-glow"].includes(id);
  },
}));
vi.mock("@/lib/tier", () => ({ FREE_LINK_LIMIT: 5 }));

const { serviceError, serviceSuccess } = await import("./types");
const { createMcpServer } = await import("./server");

// ---------- Helpers ----------

const PRO_USER: ApiKeyUser = { id: "user-1", tier: "pro", username: "prouser" };
const FREE_USER: ApiKeyUser = { id: "user-2", tier: "free", username: "freeuser" };

async function createClientServer(user: ApiKeyUser) {
  const server = createMcpServer(user);
  const client = new Client({ name: "test-client", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  return client;
}

function parseResult(result: Awaited<ReturnType<Client["callTool"]>>) {
  return JSON.parse((result.content as { text: string }[])[0].text);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ===================================================================
// Schema validation (MCP SDK rejects before service is called)
// ===================================================================

describe("input schema validation", () => {
  it("create_link rejects missing required title", async () => {
    //* Arrange
    const client = await createClientServer(PRO_USER);

    //* Act
    const result = await client.callTool({ arguments: { url: "https://example.com" }, name: "create_link" });

    //* Assert
    expect(result.isError).toBe(true);
    expect(mockCreateLink).not.toHaveBeenCalled();
  });

  it("create_link rejects missing required url", async () => {
    //* Arrange
    const client = await createClientServer(PRO_USER);

    //* Act
    const result = await client.callTool({ arguments: { title: "Test" }, name: "create_link" });

    //* Assert
    expect(result.isError).toBe(true);
    expect(mockCreateLink).not.toHaveBeenCalled();
  });

  it("delete_link rejects missing required id", async () => {
    //* Arrange
    const client = await createClientServer(PRO_USER);

    //* Act
    const result = await client.callTool({ arguments: {}, name: "delete_link" });

    //* Assert
    expect(result.isError).toBe(true);
    expect(mockDeleteLink).not.toHaveBeenCalled();
  });

  it("lookup_profile rejects missing required username", async () => {
    //* Arrange
    const client = await createClientServer(PRO_USER);

    //* Act
    const result = await client.callTool({ arguments: {}, name: "lookup_profile" });

    //* Assert
    expect(result.isError).toBe(true);
    expect(mockLookupProfile).not.toHaveBeenCalled();
  });
});

// ===================================================================
// Success → MCP result format
// ===================================================================

describe("success responses", () => {
  it("get_profile returns profile data as JSON text content", async () => {
    //* Arrange
    const client = await createClientServer(PRO_USER);
    mockGetProfile.mockResolvedValue(
      serviceSuccess({
        avatarUrl: null,
        bio: "Test bio",
        createdAt: "2024-01-01T00:00:00.000Z",
        customDomain: null,
        displayName: "Pro User",
        groupCount: 1,
        linkCount: 3,
        pageDarkTheme: "dark-depths",
        pageLightTheme: "stateroom",
        profileUrl: "https://anchr.to/prouser",
        tier: "pro",
        totalClicks: 50,
        username: "prouser",
      }),
    );

    //* Act
    const result = await client.callTool({ arguments: {}, name: "get_profile" });

    //* Assert
    expect(result.isError).toBeFalsy();
    const data = parseResult(result);
    expect(data.username).toBe("prouser");
    expect(data.linkCount).toBe(3);
    expect(data.totalClicks).toBe(50);
  });

  it("list_links returns array as JSON text content", async () => {
    //* Arrange
    const client = await createClientServer(PRO_USER);
    mockListLinks.mockResolvedValue(
      serviceSuccess([
        { id: "l1", position: 0, slug: "test", title: "Test", url: "https://example.com", visible: true },
      ]),
    );

    //* Act
    const result = await client.callTool({ arguments: {}, name: "list_links" });

    //* Assert
    expect(result.isError).toBeFalsy();
    const data = parseResult(result);
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("Test");
  });

  it("create_link passes arguments through to service", async () => {
    //* Arrange
    const client = await createClientServer(PRO_USER);
    mockCreateLink.mockResolvedValue(
      serviceSuccess({ id: "new-id", slug: "my-link", title: "My Link", url: "https://example.com" }),
    );

    //* Act
    await client.callTool({
      arguments: { groupId: "g1", slug: "my-link", title: "My Link", url: "https://example.com" },
      name: "create_link",
    });

    //* Assert
    expect(mockCreateLink).toHaveBeenCalledWith(PRO_USER, {
      groupId: "g1",
      slug: "my-link",
      title: "My Link",
      url: "https://example.com",
    });
  });

  it("delete_link returns null data on success", async () => {
    //* Arrange
    const client = await createClientServer(PRO_USER);
    mockDeleteLink.mockResolvedValue(serviceSuccess(null));

    //* Act
    const result = await client.callTool({ arguments: { id: "link-1" }, name: "delete_link" });

    //* Assert
    expect(result.isError).toBeFalsy();
    expect(parseResult(result)).toBeNull();
  });
});

// ===================================================================
// Error responses → MCP isError format
// ===================================================================

describe("error responses", () => {
  it("NOT_FOUND propagates as isError with code and message", async () => {
    //* Arrange
    const client = await createClientServer(PRO_USER);
    mockGetProfile.mockResolvedValue(serviceError("NOT_FOUND", "User not found.", 404));

    //* Act
    const result = await client.callTool({ arguments: {}, name: "get_profile" });

    //* Assert
    expect(result.isError).toBe(true);
    const error = parseResult(result);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe("User not found.");
  });

  it("VALIDATION_ERROR from update_profile propagates correctly", async () => {
    //* Arrange
    const client = await createClientServer(PRO_USER);
    mockUpdateProfile.mockResolvedValue(serviceError("VALIDATION_ERROR", "No fields to update.", 400));

    //* Act
    const result = await client.callTool({ arguments: {}, name: "update_profile" });

    //* Assert
    expect(result.isError).toBe(true);
    expect(parseResult(result).code).toBe("VALIDATION_ERROR");
  });
});

// ===================================================================
// Pro gating — services return PRO_REQUIRED for free users
// ===================================================================

describe("Pro gating", () => {
  it("list_groups returns PRO_REQUIRED for free users", async () => {
    //* Arrange
    const client = await createClientServer(FREE_USER);
    mockListGroups.mockResolvedValue(serviceError("PRO_REQUIRED", "This endpoint requires a Pro subscription.", 403));

    //* Act
    const result = await client.callTool({ arguments: {}, name: "list_groups" });

    //* Assert
    expect(result.isError).toBe(true);
    expect(parseResult(result).code).toBe("PRO_REQUIRED");
  });

  it("create_group returns PRO_REQUIRED for free users", async () => {
    //* Arrange
    const client = await createClientServer(FREE_USER);
    mockCreateGroup.mockResolvedValue(serviceError("PRO_REQUIRED", "This endpoint requires a Pro subscription.", 403));

    //* Act
    const result = await client.callTool({ arguments: { title: "Test" }, name: "create_group" });

    //* Assert
    expect(result.isError).toBe(true);
    expect(parseResult(result).code).toBe("PRO_REQUIRED");
  });

  it("get_analytics returns PRO_REQUIRED for free users", async () => {
    //* Arrange
    const client = await createClientServer(FREE_USER);
    mockGetAnalytics.mockResolvedValue(serviceError("PRO_REQUIRED", "This endpoint requires a Pro subscription.", 403));

    //* Act
    const result = await client.callTool({ arguments: {}, name: "get_analytics" });

    //* Assert
    expect(result.isError).toBe(true);
    expect(parseResult(result).code).toBe("PRO_REQUIRED");
  });

  it("toggle_featured_link returns PRO_REQUIRED for free users", async () => {
    //* Arrange
    const client = await createClientServer(FREE_USER);
    mockToggleFeaturedLink.mockResolvedValue(
      serviceError("PRO_REQUIRED", "This endpoint requires a Pro subscription.", 403),
    );

    //* Act
    const result = await client.callTool({ arguments: { id: "x" }, name: "toggle_featured_link" });

    //* Assert
    expect(result.isError).toBe(true);
    expect(parseResult(result).code).toBe("PRO_REQUIRED");
  });
});

// ===================================================================
// Edge cases — service-level errors that matter for production
// ===================================================================

describe("edge cases", () => {
  it("free tier link limit returns LINK_LIMIT_REACHED", async () => {
    //* Arrange
    const client = await createClientServer(FREE_USER);
    mockCreateLink.mockResolvedValue(
      serviceError("LINK_LIMIT_REACHED", "Free tier is limited to 5 links. Upgrade to Pro for unlimited links.", 403),
    );

    //* Act
    const result = await client.callTool({
      arguments: { title: "6th Link", url: "https://example.com" },
      name: "create_link",
    });

    //* Assert
    expect(result.isError).toBe(true);
    const error = parseResult(result);
    expect(error.code).toBe("LINK_LIMIT_REACHED");
    expect(error.message).toContain("5 links");
  });

  it("unsafe URL returns UNSAFE_URL", async () => {
    //* Arrange
    const client = await createClientServer(PRO_USER);
    mockCreateLink.mockResolvedValue(serviceError("UNSAFE_URL", "This URL is not allowed.", 400));

    //* Act
    const result = await client.callTool({
      arguments: { title: "Bad Link", url: "https://evil.example.com" },
      name: "create_link",
    });

    //* Assert
    expect(result.isError).toBe(true);
    expect(parseResult(result).code).toBe("UNSAFE_URL");
  });

  it("slug conflict returns PATH_ALREADY_IN_USE", async () => {
    //* Arrange
    const client = await createClientServer(PRO_USER);
    mockCreateLink.mockResolvedValue(serviceError("PATH_ALREADY_IN_USE", "This path is already in use.", 409));

    //* Act
    const result = await client.callTool({
      arguments: { slug: "taken", title: "Link", url: "https://example.com" },
      name: "create_link",
    });

    //* Assert
    expect(result.isError).toBe(true);
    expect(parseResult(result).code).toBe("PATH_ALREADY_IN_USE");
  });

  it("QuickLinks group modification returns FORBIDDEN", async () => {
    //* Arrange
    const client = await createClientServer(PRO_USER);
    mockUpdateGroup.mockResolvedValue(serviceError("FORBIDDEN", "Quick Links group cannot be modified.", 403));

    //* Act
    const result = await client.callTool({
      arguments: { id: "quicklinks-id", title: "Renamed" },
      name: "update_group",
    });

    //* Assert
    expect(result.isError).toBe(true);
    expect(parseResult(result).code).toBe("FORBIDDEN");
  });

  it("group ownership violation on create_link returns NOT_FOUND", async () => {
    //* Arrange
    const client = await createClientServer(PRO_USER);
    mockCreateLink.mockResolvedValue(serviceError("NOT_FOUND", "Group not found.", 404));

    //* Act
    const result = await client.callTool({
      arguments: { groupId: "not-my-group", title: "Link", url: "https://example.com" },
      name: "create_link",
    });

    //* Assert
    expect(result.isError).toBe(true);
    expect(parseResult(result).code).toBe("NOT_FOUND");
  });

  it("unhandled service exception surfaces as MCP error", async () => {
    //* Arrange
    const client = await createClientServer(PRO_USER);
    mockGetProfile.mockRejectedValue(new Error("Database connection failed"));

    //* Act
    const result = await client.callTool({ arguments: {}, name: "get_profile" });

    //* Assert
    expect(result.isError).toBe(true);
  });
});

// ===================================================================
// Discovery — works regardless of server user tier
// ===================================================================

describe("discovery", () => {
  it("lookup_profile works from a free-user server instance", async () => {
    //* Arrange
    const client = await createClientServer(FREE_USER);
    mockLookupProfile.mockResolvedValue(
      serviceSuccess({
        avatarUrl: null,
        bio: "Hello",
        displayName: "Someone",
        groups: [],
        links: [],
        profileUrl: "https://anchr.to/someone",
        username: "someone",
      }),
    );

    //* Act
    const result = await client.callTool({ arguments: { username: "someone" }, name: "lookup_profile" });

    //* Assert
    expect(result.isError).toBeFalsy();
    expect(parseResult(result).username).toBe("someone");
  });

  it("lookup_profile passes username to service", async () => {
    //* Arrange
    const client = await createClientServer(PRO_USER);
    mockLookupProfile.mockResolvedValue(serviceError("NOT_FOUND", "User not found.", 404));

    //* Act
    await client.callTool({ arguments: { username: "nobody" }, name: "lookup_profile" });

    //* Assert
    expect(mockLookupProfile).toHaveBeenCalledWith("nobody");
  });
});
