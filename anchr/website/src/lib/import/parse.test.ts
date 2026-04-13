import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parsePage } from "./parse";

const FIXTURES = resolve(__dirname, "__fixtures__");

function readFixture(name: string): string {
  return readFileSync(resolve(FIXTURES, name), "utf-8");
}

function wrapLinktreeHtml(nextDataJson: string): string {
  return `<!DOCTYPE html><html><head></head><body><script id="__NEXT_DATA__" type="application/json">${nextDataJson}</script></body></html>`;
}

describe("parsePage", () => {
  describe("linktree parser", () => {
    it("extracts links and profile from __NEXT_DATA__", () => {
      //* Arrange
      const json = readFixture("linktree-page.json");
      const html = wrapLinktreeHtml(json);

      //* Act
      const result = parsePage(html, "https://linktr.ee/testcreator");

      //* Assert
      expect(result.source).toBe("linktree");
      expect(result.profile.displayName).toBe("Test Creator");
      expect(result.profile.bio).toBe("Digital creator & musician. Based in Portland.");
      expect(result.profile.avatarUrl).toBe("https://ugc.production.linktr.ee/example-avatar.jpeg");
      expect(result.links.length).toBe(8);
      expect(result.links[0].title).toBe("My YouTube Channel");
      expect(result.links[0].url).toBe("https://youtube.com/@testcreator");
      expect(result.links[0].platform).toBe("youtube");
      expect(result.links[1].platform).toBe("instagram");
      expect(result.links[3].platform).toBe("patreon");
      expect(result.links[4].platform).toBe("github");
    });

    it("falls back to hostname for empty title", () => {
      //* Arrange
      const json = readFixture("linktree-page.json");
      const html = wrapLinktreeHtml(json);

      //* Act
      const result = parsePage(html, "https://linktr.ee/testcreator");

      //* Assert
      expect(result.links[5].title).toBe("example.com");
    });

    it("deduplicates social links already in main links", () => {
      //* Arrange
      const json = readFixture("linktree-page.json");
      const html = wrapLinktreeHtml(json);

      //* Act
      const result = parsePage(html, "https://linktr.ee/testcreator");

      //* Assert
      const instagramLinks = result.links.filter((l) => l.url.includes("instagram.com/testcreator"));
      expect(instagramLinks.length).toBe(1);
    });

    it("works on custom domains (content-based detection)", () => {
      //* Arrange
      const json = readFixture("linktree-page.json");
      const html = wrapLinktreeHtml(json);

      //* Act
      const result = parsePage(html, "https://links.mycustomdomain.com");

      //* Assert
      expect(result.source).toBe("linktree");
      expect(result.links.length).toBeGreaterThan(0);
    });

    it("assigns sequential positions", () => {
      //* Arrange
      const json = readFixture("linktree-page.json");
      const html = wrapLinktreeHtml(json);

      //* Act
      const result = parsePage(html, "https://linktr.ee/testcreator");

      //* Assert
      result.links.forEach((link, i) => {
        expect(link.position).toBe(i);
      });
    });

    it("sets all links as visible", () => {
      //* Arrange
      const json = readFixture("linktree-page.json");
      const html = wrapLinktreeHtml(json);

      //* Act
      const result = parsePage(html, "https://linktr.ee/testcreator");

      //* Assert
      result.links.forEach((link) => {
        expect(link.visible).toBe(true);
      });
    });
  });

  describe("generic parser", () => {
    it("extracts links and profile from HTML", () => {
      //* Arrange
      const html = readFixture("generic-page.html");

      //* Act
      const result = parsePage(html, "https://janedoe.bio");

      //* Assert
      expect(result.source).toBe("generic");
      expect(result.profile.displayName).toBe("Jane Doe");
      expect(result.profile.bio).toBe("Freelance designer & illustrator");
      expect(result.profile.avatarUrl).toBe("https://example.com/avatar.jpg");
      expect(result.links.length).toBe(5);
      expect(result.links[0].url).toBe("https://github.com/janedoe");
      expect(result.links[0].platform).toBe("github");
      expect(result.links[1].platform).toBe("linkedin");
      expect(result.links[3].platform).toBe("kofi");
      expect(result.links[4].platform).toBe("youtube");
    });

    it("skips relative and fragment links", () => {
      //* Arrange
      const html = readFixture("generic-page.html");

      //* Act
      const result = parsePage(html, "https://janedoe.bio");

      //* Assert
      const urls = result.links.map((l) => l.url);
      expect(urls.every((u) => u.startsWith("http"))).toBe(true);
    });

    it("skips same-domain links", () => {
      //* Arrange
      const html = `<html><head></head><body>
        <a href="https://example.com/page1">Internal</a>
        <a href="https://github.com/user">GitHub</a>
      </body></html>`;

      //* Act
      const result = parsePage(html, "https://example.com");

      //* Assert
      expect(result.links.length).toBe(1);
      expect(result.links[0].url).toBe("https://github.com/user");
    });

    it("returns empty profile when no meta tags exist", () => {
      //* Arrange
      const html = "<html><body><a href='https://github.com/test'>GitHub</a></body></html>";

      //* Act
      const result = parsePage(html, "https://example.com");

      //* Assert
      expect(result.profile.displayName).toBeNull();
      expect(result.profile.bio).toBeNull();
      expect(result.profile.avatarUrl).toBeNull();
    });

    it("returns empty links when no external links found", () => {
      //* Arrange
      const html = "<html><body><a href='/about'>About</a><a href='#top'>Top</a></body></html>";

      //* Act
      const result = parsePage(html, "https://example.com");

      //* Assert
      expect(result.links.length).toBe(0);
    });

    it("deduplicates by URL", () => {
      //* Arrange
      const html = `<html><body>
        <a href="https://github.com/user">GitHub</a>
        <a href="https://github.com/user">Also GitHub</a>
      </body></html>`;

      //* Act
      const result = parsePage(html, "https://example.com");

      //* Assert
      expect(result.links.length).toBe(1);
    });
  });

  describe("fallback behavior", () => {
    it("falls through to generic parser when __NEXT_DATA__ is malformed", () => {
      //* Arrange
      const html = `<html><head><meta property="og:title" content="Fallback Page" /></head><body>
        <script id="__NEXT_DATA__" type="application/json">{"not": "linktree"}</script>
        <a href="https://github.com/test">GitHub</a>
      </body></html>`;

      //* Act
      const result = parsePage(html, "https://example.com");

      //* Assert
      expect(result.source).toBe("generic");
      expect(result.profile.displayName).toBe("Fallback Page");
    });

    it("falls through to generic parser when __NEXT_DATA__ has invalid JSON", () => {
      //* Arrange
      const html = `<html><body>
        <script id="__NEXT_DATA__" type="application/json">{invalid json}</script>
        <a href="https://github.com/test">GitHub</a>
      </body></html>`;

      //* Act
      const result = parsePage(html, "https://example.com");

      //* Assert
      expect(result.source).toBe("generic");
    });
  });
});
