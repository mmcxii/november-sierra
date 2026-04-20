import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The whitelist reads env lazily and caches the parsed result, so each test
// has to mock the env module and reset the cache between cases.
vi.mock("@/lib/env", () => ({
  envSchema: {
    ADMIN_USER_ID: undefined,
    AUTH_WHITELIST_USER_IDS: undefined,
  },
}));

describe("isWhitelistedForBetterAuth", () => {
  let envModule: typeof import("@/lib/env");
  let whitelistModule: typeof import("./whitelist");

  beforeEach(async () => {
    envModule = await import("@/lib/env");
    whitelistModule = await import("./whitelist");
    whitelistModule.resetWhitelistCacheForTesting();
    Reflect.set(envModule.envSchema, "ADMIN_USER_ID", undefined);
    Reflect.set(envModule.envSchema, "AUTH_WHITELIST_USER_IDS", undefined);
  });

  afterEach(() => {
    whitelistModule.resetWhitelistCacheForTesting();
  });

  it("returns false when nothing is configured", () => {
    //* Arrange
    //* Act
    const result = whitelistModule.isWhitelistedForBetterAuth("user_abc");

    //* Assert
    expect(result).toBe(false);
  });

  it("includes users from AUTH_WHITELIST_USER_IDS", () => {
    //* Arrange
    Reflect.set(envModule.envSchema, "AUTH_WHITELIST_USER_IDS", "user_a, user_b ,user_c");

    //* Act
    const a = whitelistModule.isWhitelistedForBetterAuth("user_a");
    const b = whitelistModule.isWhitelistedForBetterAuth("user_b");
    const c = whitelistModule.isWhitelistedForBetterAuth("user_c");
    const d = whitelistModule.isWhitelistedForBetterAuth("user_d");

    //* Assert
    expect(a).toBe(true);
    expect(b).toBe(true);
    expect(c).toBe(true);
    expect(d).toBe(false);
  });

  it("implicitly whitelists ADMIN_USER_ID", () => {
    //* Arrange
    Reflect.set(envModule.envSchema, "ADMIN_USER_ID", "user_admin");

    //* Act
    const result = whitelistModule.isWhitelistedForBetterAuth("user_admin");

    //* Assert
    expect(result).toBe(true);
  });

  it("rejects null/empty user ids", () => {
    //* Arrange
    Reflect.set(envModule.envSchema, "AUTH_WHITELIST_USER_IDS", "user_a");

    //* Act
    const nullResult = whitelistModule.isWhitelistedForBetterAuth(null);
    const emptyResult = whitelistModule.isWhitelistedForBetterAuth("");
    const undefResult = whitelistModule.isWhitelistedForBetterAuth(undefined);

    //* Assert
    expect(nullResult).toBe(false);
    expect(emptyResult).toBe(false);
    expect(undefResult).toBe(false);
  });
});
