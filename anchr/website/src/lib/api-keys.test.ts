import { createHash } from "crypto";
import { describe, expect, it } from "vitest";
import { formatMaskedKey, generateApiKey, getKeyPrefix, getKeySuffix, hashApiKey, isValidApiKeyName } from "./api-keys";

describe("generateApiKey", () => {
  it("produces a key starting with anc_k_ prefix", () => {
    //* Act
    const key = generateApiKey();

    //* Assert
    expect(key.startsWith("anc_k_")).toBe(true);
  });

  it("produces a key with exactly 38 characters (6 prefix + 32 body)", () => {
    //* Act
    const key = generateApiKey();

    //* Assert
    expect(key.length).toBe(38);
  });

  it("produces a key body containing only alphanumeric characters", () => {
    //* Act
    const key = generateApiKey();
    const body = key.slice(6);

    //* Assert
    expect(body).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it("produces unique keys on successive calls", () => {
    //* Act
    const keys = new Set(Array.from({ length: 100 }, () => generateApiKey()));

    //* Assert
    expect(keys.size).toBe(100);
  });
});

describe("hashApiKey", () => {
  it("returns a SHA-256 hex digest", () => {
    //* Arrange
    const rawKey = "anc_k_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6";

    //* Act
    const hash = hashApiKey(rawKey);

    //* Assert
    const expected = createHash("sha256").update(rawKey).digest("hex");
    expect(hash).toBe(expected);
  });

  it("returns a 64-character hex string", () => {
    //* Arrange
    const rawKey = generateApiKey();

    //* Act
    const hash = hashApiKey(rawKey);

    //* Assert
    expect(hash.length).toBe(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it("produces different hashes for different keys", () => {
    //* Arrange
    const key1 = generateApiKey();
    const key2 = generateApiKey();

    //* Act
    const hash1 = hashApiKey(key1);
    const hash2 = hashApiKey(key2);

    //* Assert
    expect(hash1).not.toBe(hash2);
  });
});

describe("getKeyPrefix", () => {
  it("returns anc_k_ plus first 4 chars of the key body", () => {
    //* Arrange
    const rawKey = "anc_k_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6";

    //* Act
    const prefix = getKeyPrefix(rawKey);

    //* Assert
    expect(prefix).toBe("anc_k_a1b2");
  });
});

describe("getKeySuffix", () => {
  it("returns the last 4 characters of the raw key", () => {
    //* Arrange
    const rawKey = "anc_k_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6";

    //* Act
    const suffix = getKeySuffix(rawKey);

    //* Assert
    expect(suffix).toBe("o5p6");
  });
});

describe("formatMaskedKey", () => {
  it("formats prefix + dots + suffix", () => {
    //* Arrange
    const prefix = "anc_k_a1b2";
    const suffix = "o5p6";

    //* Act
    const masked = formatMaskedKey(prefix, suffix);

    //* Assert
    expect(masked).toBe("anc_k_a1b2••••o5p6");
  });
});

describe("isValidApiKeyName", () => {
  it("accepts a simple alphanumeric name", () => {
    //* Act
    const result = isValidApiKeyName("MyKey1");

    //* Assert
    expect(result).toBe(true);
  });

  it("accepts names with spaces, hyphens, and underscores", () => {
    //* Act
    const result = isValidApiKeyName("My API Key-1_test");

    //* Assert
    expect(result).toBe(true);
  });

  it("rejects an empty string", () => {
    //* Act
    const result = isValidApiKeyName("");

    //* Assert
    expect(result).toBe(false);
  });

  it("rejects a name exceeding 64 characters", () => {
    //* Arrange
    const longName = "a".repeat(65);

    //* Act
    const result = isValidApiKeyName(longName);

    //* Assert
    expect(result).toBe(false);
  });

  it("accepts a name at exactly 64 characters", () => {
    //* Arrange
    const maxName = "a".repeat(64);

    //* Act
    const result = isValidApiKeyName(maxName);

    //* Assert
    expect(result).toBe(true);
  });

  it("rejects names with special characters", () => {
    //* Act
    const atResult = isValidApiKeyName("key@name");
    const bangResult = isValidApiKeyName("key!");
    const dotResult = isValidApiKeyName("key.name");

    //* Assert
    expect(atResult).toBe(false);
    expect(bangResult).toBe(false);
    expect(dotResult).toBe(false);
  });
});
