import { describe, expect, it } from "vitest";
import { NOSTR_CLIENTS, buildNostrProfileUrl, detectNostrClient, isNpub } from "./nostr";

describe("isNpub", () => {
  it("accepts a valid npub", () => {
    //* Arrange
    const npub = "npub1c8fl8yycevasawjw7xcx924xlqjkkwev9pyxwx9mh3temajzyglqcyhtuy";

    //* Act
    const result = isNpub(npub);

    //* Assert
    expect(result).toBe(true);
  });

  it("accepts a valid npub with leading/trailing whitespace", () => {
    //* Arrange
    const npub = "  npub1c8fl8yycevasawjw7xcx924xlqjkkwev9pyxwx9mh3temajzyglqcyhtuy  ";

    //* Act
    const result = isNpub(npub);

    //* Assert
    expect(result).toBe(true);
  });

  it("rejects a string that does not start with npub1", () => {
    //* Arrange
    const value = "nsec1c8fl8yycevasawjw7xcx924xlqjkkwev9pyxwx9mh3temajzyglqcyhtuy";

    //* Act
    const result = isNpub(value);

    //* Assert
    expect(result).toBe(false);
  });

  it("rejects an npub with wrong length", () => {
    //* Arrange
    const tooShort = "npub1abc";
    const tooLong = "npub1c8fl8yycevasawjw7xcx924xlqjkkwev9pyxwx9mh3temajzyglqcyhtuyextra";

    //* Act
    const shortResult = isNpub(tooShort);
    const longResult = isNpub(tooLong);

    //* Assert
    expect(shortResult).toBe(false);
    expect(longResult).toBe(false);
  });

  it("rejects uppercase characters", () => {
    //* Arrange
    const value = "npub1C8FL8YYCEVASAWJW7XCX924XLQJKKWEV9PYXWX9MH3TEMAJZYGLQCYHTUY";

    //* Act
    const result = isNpub(value);

    //* Assert
    expect(result).toBe(false);
  });

  it("rejects a plain URL", () => {
    //* Arrange
    const value = "https://example.com";

    //* Act
    const result = isNpub(value);

    //* Assert
    expect(result).toBe(false);
  });

  it("rejects an empty string", () => {
    //* Act
    const result = isNpub("");

    //* Assert
    expect(result).toBe(false);
  });
});

describe("buildNostrProfileUrl", () => {
  const npub = "npub1c8fl8yycevasawjw7xcx924xlqjkkwev9pyxwx9mh3temajzyglqcyhtuy";

  it("builds a Primal profile URL", () => {
    //* Act
    const url = buildNostrProfileUrl(npub, "primal");

    //* Assert
    expect(url).toBe(`https://primal.net/p/${npub}`);
  });

  it("builds a Snort profile URL", () => {
    //* Act
    const url = buildNostrProfileUrl(npub, "snort");

    //* Assert
    expect(url).toBe(`https://snort.social/p/${npub}`);
  });

  it("builds a noStrudel profile URL with hash fragment", () => {
    //* Act
    const url = buildNostrProfileUrl(npub, "nostrudel");

    //* Assert
    expect(url).toBe(`https://nostrudel.ninja/#/u/${npub}`);
  });

  it("builds a custom profile URL from a template", () => {
    //* Arrange
    const template = "https://myclient.com/profile/{npub}";

    //* Act
    const url = buildNostrProfileUrl(npub, "custom", template);

    //* Assert
    expect(url).toBe(`https://myclient.com/profile/${npub}`);
  });

  it("throws when custom client has no template", () => {
    //* Arrange
    const fn = () => buildNostrProfileUrl(npub, "custom");

    //* Act
    const result = () => fn();

    //* Assert
    expect(result).toThrow();
  });

  it("builds correct URLs for all non-custom clients", () => {
    //* Arrange
    const nonCustomClients = NOSTR_CLIENTS.filter((c) => c.id !== "custom");

    //* Act
    const urls = nonCustomClients.map((c) => buildNostrProfileUrl(npub, c.id));

    //* Assert
    for (const url of urls) {
      expect(url).toContain(npub);
      expect(url).toMatch(/^https:\/\//);
    }
  });
});

describe("detectNostrClient", () => {
  const npub = "npub1c8fl8yycevasawjw7xcx924xlqjkkwev9pyxwx9mh3temajzyglqcyhtuy";

  it("detects Primal from URL", () => {
    //* Act
    const result = detectNostrClient(`https://primal.net/p/${npub}`);

    //* Assert
    expect(result.clientId).toBe("primal");
  });

  it("detects Snort from URL", () => {
    //* Act
    const result = detectNostrClient(`https://snort.social/p/${npub}`);

    //* Assert
    expect(result.clientId).toBe("snort");
  });

  it("detects Coracle from URL", () => {
    //* Act
    const result = detectNostrClient(`https://coracle.social/${npub}`);

    //* Assert
    expect(result.clientId).toBe("coracle");
  });

  it("detects Iris from URL", () => {
    //* Act
    const result = detectNostrClient(`https://iris.to/${npub}`);

    //* Assert
    expect(result.clientId).toBe("iris");
  });

  it("detects njump from URL", () => {
    //* Act
    const result = detectNostrClient(`https://njump.me/${npub}`);

    //* Assert
    expect(result.clientId).toBe("njump");
  });

  it("detects noStrudel from URL", () => {
    //* Act
    const result = detectNostrClient(`https://nostrudel.ninja/#/u/${npub}`);

    //* Assert
    expect(result.clientId).toBe("nostrudel");
  });

  it("returns custom with template for unknown domains", () => {
    //* Arrange
    const url = `https://myclient.com/profile/${npub}`;

    //* Act
    const result = detectNostrClient(url);

    //* Assert
    expect(result.clientId).toBe("custom");
    expect(result.customTemplate).toBe("https://myclient.com/profile/{npub}");
  });

  it("falls back to primal for URLs without npub", () => {
    //* Act
    const result = detectNostrClient("https://unknown.com/profile/someone");

    //* Assert
    expect(result.clientId).toBe("primal");
  });
});
