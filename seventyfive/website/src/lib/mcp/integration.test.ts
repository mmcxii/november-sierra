import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockListTeams = vi.fn();
vi.mock("@/lib/mcp/services/teams", () => {
  return {
    listTeams: (...args: unknown[]) => {
      return mockListTeams(...args);
    },
  };
});

const mockGetBoard = vi.fn();
vi.mock("@/lib/mcp/services/board", () => {
  return {
    getBoard: (...args: unknown[]) => {
      return mockGetBoard(...args);
    },
  };
});

const mockSetTask = vi.fn();
vi.mock("@/lib/mcp/services/tasks", () => {
  return {
    setTask: (...args: unknown[]) => {
      return mockSetTask(...args);
    },
  };
});

vi.mock("@/lib/db/client", () => {
  return { db: {} };
});

const { serviceError, serviceSuccess } = await import("./types");
const { createMcpServer } = await import("./server");

const USER = { id: "user-1", timeZone: "UTC", username: "guy" };

async function createClient() {
  const server = createMcpServer(USER);
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

describe("MCP tools", () => {
  it("list_teams returns the user's teams", async () => {
    //* Arrange
    mockListTeams.mockResolvedValue(
      serviceSuccess({ teams: [{ teamId: "team-1", teamName: "Dawn" }], todayLocal: "2026-08-27" }),
    );
    const client = await createClient();

    //* Act
    const result = await client.callTool({ arguments: {}, name: "list_teams" });

    //* Assert
    expect(result.isError).toBeFalsy();
    expect(parseResult(result).teams[0].teamName).toBe("Dawn");
  });

  it("get_board requires teamId", async () => {
    //* Arrange
    const client = await createClient();

    //* Act
    const result = await client.callTool({ arguments: {}, name: "get_board" });

    //* Assert
    expect(result.isError).toBe(true);
    expect(mockGetBoard).not.toHaveBeenCalled();
  });

  it("get_board returns roster and tasks", async () => {
    //* Arrange
    mockGetBoard.mockResolvedValue(
      serviceSuccess({
        date: "2026-08-27",
        me: { tasks: [{ checked: false, id: "water", label: "Drink 3 liters of water" }] },
        roster: [{ displayName: "Guy", isSelf: true }],
      }),
    );
    const client = await createClient();

    //* Act
    const result = await client.callTool({ arguments: { teamId: "team-1" }, name: "get_board" });

    //* Assert
    expect(parseResult(result).me.tasks[0].id).toBe("water");
    expect(mockGetBoard).toHaveBeenCalledWith(USER, { date: undefined, teamId: "team-1" });
  });

  it("set_task checks a task", async () => {
    //* Arrange
    mockSetTask.mockResolvedValue(
      serviceSuccess({ checked: true, date: "2026-08-27", taskId: "water", teamCelebration: false }),
    );
    const client = await createClient();

    //* Act
    const result = await client.callTool({
      arguments: { checked: true, taskId: "water", teamId: "team-1" },
      name: "set_task",
    });

    //* Assert
    expect(result.isError).toBeFalsy();
    expect(parseResult(result).checked).toBe(true);
  });

  it("set_task surfaces a read-only day", async () => {
    //* Arrange
    mockSetTask.mockResolvedValue(serviceError("thisDayIsReadOnly", "This day is read-only"));
    const client = await createClient();

    //* Act
    const result = await client.callTool({
      arguments: { checked: true, taskId: "water", teamId: "team-1" },
      name: "set_task",
    });

    //* Assert
    expect(result.isError).toBe(true);
    expect(parseResult(result).code).toBe("thisDayIsReadOnly");
  });
});
