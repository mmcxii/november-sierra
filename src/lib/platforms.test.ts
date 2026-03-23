import { describe, expect, it } from "vitest";
import { PLATFORMS, PLATFORM_IDS, detectPlatform, getPlatformBrandColor, isValidPlatformId } from "./platforms";

describe("detectPlatform", () => {
  it("detects social platforms from URLs", () => {
    //* Act
    const results = [
      detectPlatform("https://youtube.com/watch?v=abc"),
      detectPlatform("https://www.youtube.com/@channel"),
      detectPlatform("https://youtu.be/abc"),
      detectPlatform("https://instagram.com/user"),
      detectPlatform("https://www.instagram.com/user"),
      detectPlatform("https://twitter.com/user"),
      detectPlatform("https://x.com/user"),
      detectPlatform("https://tiktok.com/@user"),
      detectPlatform("https://www.tiktok.com/@user"),
      detectPlatform("https://linkedin.com/in/user"),
      detectPlatform("https://www.linkedin.com/in/user"),
      detectPlatform("https://github.com/user"),
      detectPlatform("https://twitch.tv/user"),
      detectPlatform("https://www.twitch.tv/user"),
    ];

    //* Assert
    expect(results).toEqual([
      "youtube",
      "youtube",
      "youtube",
      "instagram",
      "instagram",
      "x",
      "x",
      "tiktok",
      "tiktok",
      "linkedin",
      "linkedin",
      "github",
      "twitch",
      "twitch",
    ]);
  });

  it("detects payment platforms from URLs", () => {
    //* Act
    const results = [
      detectPlatform("https://venmo.com/user"),
      detectPlatform("https://cash.app/$user"),
      detectPlatform("https://paypal.com/paypalme/user"),
      detectPlatform("https://paypal.me/user"),
      detectPlatform("https://ko-fi.com/user"),
      detectPlatform("https://buymeacoffee.com/user"),
      detectPlatform("https://www.buymeacoffee.com/user"),
      detectPlatform("https://patreon.com/user"),
      detectPlatform("https://www.patreon.com/user"),
    ];

    //* Assert
    expect(results).toEqual([
      "venmo",
      "cashapp",
      "paypal",
      "paypal",
      "kofi",
      "buymeacoffee",
      "buymeacoffee",
      "patreon",
      "patreon",
    ]);
  });

  it("detects Nostr clients from URLs", () => {
    //* Act
    const results = [
      detectPlatform("https://primal.net/p/npub1abc"),
      detectPlatform("https://snort.social/p/npub1abc"),
      detectPlatform("https://coracle.social/npub1abc"),
      detectPlatform("https://iris.to/npub1abc"),
      detectPlatform("https://njump.me/npub1abc"),
      detectPlatform("https://nostrudel.ninja/#/u/npub1abc"),
    ];

    //* Assert
    expect(results).toEqual(["nostr", "nostr", "nostr", "nostr", "nostr", "nostr"]);
  });

  it("returns null for non-HTTP URI schemes", () => {
    //* Act
    const bitcoin = detectPlatform("bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
    const lightning = detectPlatform("lightning:lnbc1234");
    const nostr = detectPlatform("nostr:npub1abc");

    //* Assert
    expect(bitcoin).toBeNull();
    expect(lightning).toBeNull();
    expect(nostr).toBeNull();
  });

  it("handles URLs without protocol", () => {
    //* Act
    const youtube = detectPlatform("youtube.com/watch?v=abc");
    const github = detectPlatform("github.com/user");

    //* Assert
    expect(youtube).toBe("youtube");
    expect(github).toBe("github");
  });

  it("handles URLs with subdomains", () => {
    //* Act
    const result = detectPlatform("https://m.youtube.com/watch?v=abc");

    //* Assert
    expect(result).toBe("youtube");
  });

  it("returns null for unknown URLs", () => {
    //* Act
    const example = detectPlatform("https://example.com");
    const mywebsite = detectPlatform("https://mywebsite.org");
    const notAUrl = detectPlatform("not-a-url");

    //* Assert
    expect(example).toBeNull();
    expect(mywebsite).toBeNull();
    expect(notAUrl).toBeNull();
  });

  it("handles empty and whitespace strings", () => {
    //* Act
    const empty = detectPlatform("");
    const whitespace = detectPlatform("   ");

    //* Assert
    expect(empty).toBeNull();
    expect(whitespace).toBeNull();
  });

  it("is case insensitive", () => {
    //* Act
    const youtube = detectPlatform("https://YOUTUBE.COM/watch");
    const github = detectPlatform("https://GITHUB.COM/user");

    //* Assert
    expect(youtube).toBe("youtube");
    expect(github).toBe("github");
  });
});

describe("isValidPlatformId", () => {
  it("returns true for valid platform IDs", () => {
    //* Act
    const results = PLATFORM_IDS.map((id) => isValidPlatformId(id));

    //* Assert
    for (const result of results) {
      expect(result).toBe(true);
    }
  });

  it("returns false for invalid platform IDs", () => {
    //* Act
    const nonexistent = isValidPlatformId("nonexistent");
    const empty = isValidPlatformId("");

    //* Assert
    expect(nonexistent).toBe(false);
    expect(empty).toBe(false);
  });
});

describe("getPlatformBrandColor", () => {
  it("returns light/dark pair for branded platforms", () => {
    //* Act
    const youtube = getPlatformBrandColor("youtube");
    const venmo = getPlatformBrandColor("venmo");
    const cashapp = getPlatformBrandColor("cashapp");
    const instagram = getPlatformBrandColor("instagram");
    const patreon = getPlatformBrandColor("patreon");

    //* Assert
    expect(youtube).toEqual({ dark: "#FF0000", light: "#FF0000" });
    expect(venmo).toEqual({ dark: "#008CFF", light: "#008CFF" });
    expect(cashapp).toEqual({ dark: "#00D54B", light: "#00D54B" });
    expect(instagram).toEqual({ dark: "#E4405F", light: "#E4405F" });
    expect(patreon).toEqual({ dark: "#FF424D", light: "#FF424D" });
  });

  it("returns distinct light/dark values for monochrome brands", () => {
    //* Act
    const github = getPlatformBrandColor("github");
    const x = getPlatformBrandColor("x");

    //* Assert
    expect(github).toBeDefined();
    expect(github?.light).not.toBe(github?.dark);
    expect(x).toBeDefined();
    expect(x?.light).not.toBe(x?.dark);
  });

  it("returns undefined for invalid platform IDs", () => {
    //* Act
    const nonexistent = getPlatformBrandColor("nonexistent");
    const empty = getPlatformBrandColor("");

    //* Assert
    expect(nonexistent).toBeUndefined();
    expect(empty).toBeUndefined();
  });

  it("every platform has a brandColor", () => {
    //* Act
    const colors = PLATFORM_IDS.map((id) => PLATFORMS[id].brandColor);

    //* Assert
    for (const color of colors) {
      expect(color).toBeDefined();
    }
  });

  it("all brandColor values match hex format", () => {
    //* Act
    const colors = PLATFORM_IDS.map((id) => PLATFORMS[id].brandColor);

    //* Assert
    for (const bc of colors) {
      expect(bc.light).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(bc.dark).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe("platform data", () => {
  it("PLATFORMS has an entry for every PLATFORM_IDS value", () => {
    //* Act
    const platformKeys = Object.keys(PLATFORMS).sort();
    const idsSorted = [...PLATFORM_IDS].sort();

    //* Assert
    expect(platformKeys).toEqual(idsSorted);
  });

  it("every platform has a non-empty name", () => {
    //* Act
    const names = PLATFORM_IDS.map((id) => PLATFORMS[id].name);

    //* Assert
    for (const name of names) {
      expect(name.length).toBeGreaterThan(0);
    }
  });
});
