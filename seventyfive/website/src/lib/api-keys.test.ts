import { describe, expect, it } from "vitest";
import {
  API_KEY_PREFIX,
  formatMaskedKey,
  generateApiKey,
  getKeyPrefix,
  getKeySuffix,
  hashApiKey,
  isValidApiKeyName,
  mcpClientConfig,
} from "./api-keys";

describe("generateApiKey", () => {
  it("uses the SeventyFive prefix and a 32-char body", () => {
    //* Act
    const key = generateApiKey();

    //* Assert
    expect(key.startsWith(API_KEY_PREFIX)).toBe(true);
    expect(key).toHaveLength(API_KEY_PREFIX.length + 32);
  });
});

describe("hashApiKey", () => {
  it("returns a stable hex digest", () => {
    //* Arrange
    const rawKey = `${API_KEY_PREFIX}${"a".repeat(32)}`;

    //* Act
    const hash = hashApiKey(rawKey);

    //* Assert
    expect(hash).toHaveLength(64);
    expect(hashApiKey(rawKey)).toBe(hash);
  });
});

describe("masked key helpers", () => {
  it("formats prefix, suffix, and mask", () => {
    //* Arrange
    const rawKey = `${API_KEY_PREFIX}abcd${"x".repeat(24)}wxyz`;

    //* Act
    const prefix = getKeyPrefix(rawKey);
    const suffix = getKeySuffix(rawKey);

    //* Assert
    expect(prefix).toBe(`${API_KEY_PREFIX}abcd`);
    expect(suffix).toBe("wxyz");
    expect(formatMaskedKey(prefix, suffix)).toBe(`${API_KEY_PREFIX}abcd••••wxyz`);
  });
});

describe("isValidApiKeyName", () => {
  it("accepts letters, numbers, spaces, hyphens, and underscores", () => {
    //* Act
    const cursor = isValidApiKeyName("Cursor");
    const spaced = isValidApiKeyName("Claude 3");
    const mixed = isValidApiKeyName("key-1_test");

    //* Assert
    expect(cursor).toBe(true);
    expect(spaced).toBe(true);
    expect(mixed).toBe(true);
  });

  it("rejects empty, long, or punctuated names", () => {
    //* Act
    const empty = isValidApiKeyName("");
    const long = isValidApiKeyName("a".repeat(65));
    const dotted = isValidApiKeyName("key.name");

    //* Assert
    expect(empty).toBe(false);
    expect(long).toBe(false);
    expect(dotted).toBe(false);
  });
});

describe("mcpClientConfig", () => {
  it("emits a Cursor-style remote MCP config", () => {
    //* Act
    const config = mcpClientConfig("https://seventyfive.team/api/v1/mcp", "sf_k_test");

    //* Assert
    expect(JSON.parse(config)).toEqual({
      mcpServers: {
        seventyfive: {
          headers: { Authorization: "Bearer sf_k_test" },
          url: "https://seventyfive.team/api/v1/mcp",
        },
      },
    });
  });
});
