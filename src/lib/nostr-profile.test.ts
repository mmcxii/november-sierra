import { beforeEach, describe, expect, it, vi } from "vitest";

const mockWhere = vi.fn();
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

vi.mock("@/lib/db/client", () => ({ db: { update: mockUpdate } }));
vi.mock("@/lib/db/schema/user", () => ({ usersTable: { id: "id" } }));

const mockQuerySync = vi.fn();
const mockClose = vi.fn();

vi.mock("nostr-tools/pool", () => {
  return {
    SimplePool: class {
      querySync = mockQuerySync;
      close = mockClose;
    },
  };
});

// Must import after mocks are registered
const { DEFAULT_RELAYS, fetchNostrProfile, isValidRelayUrl, npubToHex, refreshNostrProfile } =
  await import("./nostr-profile");

const VALID_NPUB = "npub1c8fl8yycevasawjw7xcx924xlqjkkwev9pyxwx9mh3temajzyglqcyhtuy";
const VALID_HEX = "c1d3f39098cb3b0eba4ef1b062aaa6f8256b3b2c28486718bbbc579df642223e";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("npubToHex", () => {
  it("decodes a valid npub to a 64-char hex string", () => {
    //* Act
    const hex = npubToHex(VALID_NPUB);

    //* Assert
    expect(hex).toBe(VALID_HEX);
  });

  it("throws for an invalid npub", () => {
    //* Act
    const act = () => npubToHex("npub1invalid");

    //* Assert
    expect(act).toThrow();
  });

  it("throws for an nsec", () => {
    //* Act
    const act = () => npubToHex("nsec1c8fl8yycevasawjw7xcx924xlqjkkwev9pyxwx9mh3temajzyglqcyhtuy");

    //* Assert
    expect(act).toThrow();
  });
});

describe("isValidRelayUrl", () => {
  it("accepts a wss:// URL", () => {
    //* Act
    const result = isValidRelayUrl("wss://relay.damus.io");

    //* Assert
    expect(result).toBe(true);
  });

  it("accepts a ws:// URL", () => {
    //* Act
    const result = isValidRelayUrl("ws://localhost:8080");

    //* Assert
    expect(result).toBe(true);
  });

  it("rejects an https:// URL", () => {
    //* Act
    const result = isValidRelayUrl("https://relay.damus.io");

    //* Assert
    expect(result).toBe(false);
  });

  it("rejects an empty string", () => {
    //* Act
    const result = isValidRelayUrl("");

    //* Assert
    expect(result).toBe(false);
  });

  it("rejects garbage input", () => {
    //* Act
    const result = isValidRelayUrl("not a url at all");

    //* Assert
    expect(result).toBe(false);
  });
});

describe("fetchNostrProfile", () => {
  it("returns parsed profile data from a kind:0 event", async () => {
    //* Arrange
    mockQuerySync.mockResolvedValueOnce([
      {
        content: JSON.stringify({
          about: "Hello world",
          display_name: "Alice",
          picture: "https://example.com/avatar.jpg",
        }),
        created_at: 1000,
      },
    ]);

    //* Act
    const result = await fetchNostrProfile(VALID_NPUB, ["wss://relay.damus.io"]);

    //* Assert
    expect(result).toEqual({
      about: "Hello world",
      displayName: "Alice",
      picture: "https://example.com/avatar.jpg",
    });
  });

  it("queries relays with the decoded hex pubkey and kind:0 filter", async () => {
    //* Arrange
    mockQuerySync.mockResolvedValueOnce([]);
    const relays = ["wss://relay.damus.io", "wss://nos.lol"];

    //* Act
    await fetchNostrProfile(VALID_NPUB, relays);

    //* Assert
    expect(mockQuerySync).toHaveBeenCalledWith(relays, {
      authors: [VALID_HEX],
      kinds: [0],
      limit: 1,
    });
  });

  it("always closes the pool after fetching", async () => {
    //* Arrange
    mockQuerySync.mockResolvedValueOnce([]);
    const relays = ["wss://relay.damus.io"];

    //* Act
    await fetchNostrProfile(VALID_NPUB, relays);

    //* Assert
    expect(mockClose).toHaveBeenCalledWith(relays);
  });

  it("closes the pool even when querySync rejects", async () => {
    //* Arrange
    mockQuerySync.mockRejectedValueOnce(new Error("fail"));
    const relays = ["wss://relay.damus.io"];

    //* Act
    await fetchNostrProfile(VALID_NPUB, relays);

    //* Assert
    expect(mockClose).toHaveBeenCalledWith(relays);
  });

  it("falls back to name when display_name is missing", async () => {
    //* Arrange
    mockQuerySync.mockResolvedValueOnce([
      {
        content: JSON.stringify({ about: "Bio", name: "alice", picture: null }),
        created_at: 1000,
      },
    ]);

    //* Act
    const result = await fetchNostrProfile(VALID_NPUB, ["wss://relay.damus.io"]);

    //* Assert
    expect(result).toEqual({ about: "Bio", displayName: "alice", picture: null });
  });

  it("returns null for all fields when content has no recognized keys", async () => {
    //* Arrange
    mockQuerySync.mockResolvedValueOnce([
      {
        content: JSON.stringify({ lud16: "alice@walletofsatoshi.com" }),
        created_at: 1000,
      },
    ]);

    //* Act
    const result = await fetchNostrProfile(VALID_NPUB, ["wss://relay.damus.io"]);

    //* Assert
    expect(result).toEqual({ about: null, displayName: null, picture: null });
  });

  it("treats non-string field values as null", async () => {
    //* Arrange
    mockQuerySync.mockResolvedValueOnce([
      {
        content: JSON.stringify({ about: 42, display_name: true, name: { nested: "obj" }, picture: ["array"] }),
        created_at: 1000,
      },
    ]);

    //* Act
    const result = await fetchNostrProfile(VALID_NPUB, ["wss://relay.damus.io"]);

    //* Assert
    expect(result).toEqual({ about: null, displayName: null, picture: null });
  });

  it("picks the latest event when multiple are returned", async () => {
    //* Arrange
    mockQuerySync.mockResolvedValueOnce([
      { content: JSON.stringify({ about: "old bio", display_name: "Old", picture: "old.jpg" }), created_at: 500 },
      { content: JSON.stringify({ about: "new bio", display_name: "New", picture: "new.jpg" }), created_at: 1000 },
    ]);

    //* Act
    const result = await fetchNostrProfile(VALID_NPUB, ["wss://relay.damus.io"]);

    //* Assert
    expect(result).toEqual({ about: "new bio", displayName: "New", picture: "new.jpg" });
  });

  it("returns null when no events are found", async () => {
    //* Arrange
    mockQuerySync.mockResolvedValueOnce([]);

    //* Act
    const result = await fetchNostrProfile(VALID_NPUB, ["wss://relay.damus.io"]);

    //* Assert
    expect(result).toBeNull();
  });

  it("returns null when the pool rejects", async () => {
    //* Arrange
    mockQuerySync.mockRejectedValueOnce(new Error("Connection failed"));

    //* Act
    const result = await fetchNostrProfile(VALID_NPUB, ["wss://relay.damus.io"]);

    //* Assert
    expect(result).toBeNull();
  });
});

describe("refreshNostrProfile", () => {
  it("does nothing when nostrNpub is null", async () => {
    //* Act
    await refreshNostrProfile({ id: "user_1", nostrNpub: null, nostrRelays: null });

    //* Assert
    expect(mockQuerySync).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("uses DEFAULT_RELAYS when nostrRelays is null", async () => {
    //* Arrange
    mockQuerySync.mockResolvedValueOnce([
      { content: JSON.stringify({ display_name: "Alice" }), created_at: 1000 },
    ]);

    //* Act
    await refreshNostrProfile({ id: "user_1", nostrNpub: VALID_NPUB, nostrRelays: null });

    //* Assert
    expect(mockQuerySync).toHaveBeenCalledWith(DEFAULT_RELAYS, expect.any(Object));
  });

  it("uses user-configured relays when nostrRelays is set", async () => {
    //* Arrange
    const customRelays = ["wss://custom.relay"];
    mockQuerySync.mockResolvedValueOnce([
      { content: JSON.stringify({ display_name: "Alice" }), created_at: 1000 },
    ]);

    //* Act
    await refreshNostrProfile({ id: "user_1", nostrNpub: VALID_NPUB, nostrRelays: JSON.stringify(customRelays) });

    //* Assert
    expect(mockQuerySync).toHaveBeenCalledWith(customRelays, expect.any(Object));
  });

  it("does not write to DB when fetch returns no profile", async () => {
    //* Arrange
    mockQuerySync.mockResolvedValueOnce([]);

    //* Act
    await refreshNostrProfile({ id: "user_1", nostrNpub: VALID_NPUB, nostrRelays: null });

    //* Assert
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("writes fetched profile data to the database", async () => {
    //* Arrange
    mockQuerySync.mockResolvedValueOnce([
      {
        content: JSON.stringify({
          about: "Nostr bio",
          display_name: "Alice",
          picture: "https://example.com/avatar.jpg",
        }),
        created_at: 1000,
      },
    ]);

    //* Act
    await refreshNostrProfile({ id: "user_1", nostrNpub: VALID_NPUB, nostrRelays: null });

    //* Assert
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        avatarUrl: "https://example.com/avatar.jpg",
        bio: "Nostr bio",
        customAvatar: true,
        displayName: "Alice",
      }),
    );
  });

  it("sets customAvatar to false when profile has no picture", async () => {
    //* Arrange
    mockQuerySync.mockResolvedValueOnce([
      {
        content: JSON.stringify({ about: "bio", display_name: "Alice" }),
        created_at: 1000,
      },
    ]);

    //* Act
    await refreshNostrProfile({ id: "user_1", nostrNpub: VALID_NPUB, nostrRelays: null });

    //* Assert
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        avatarUrl: null,
        customAvatar: false,
      }),
    );
  });
});
