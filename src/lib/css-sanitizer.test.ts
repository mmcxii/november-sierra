import { describe, expect, it } from "vitest";
import { sanitizeCss } from "./css-sanitizer";

describe("sanitizeCss", () => {
  describe("valid CSS", () => {
    it("passes valid scoped CSS through unchanged", () => {
      //* Arrange
      const css = `.lp-page-bg .card { color: red; background: blue; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).toBe(css);
      expect(result.errors).toHaveLength(0);
    });

    it("handles empty input", () => {
      //* Arrange — empty string input (no setup needed)

      //* Act
      const result = sanitizeCss("");

      //* Assert
      expect(result.sanitized).toBe("");
      expect(result.errors).toHaveLength(0);
    });

    it("allows nested selectors under .lp-page-bg", () => {
      //* Arrange
      const css = `.lp-page-bg a:hover { text-decoration: underline; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).toBe(css);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("JavaScript execution / XSS", () => {
    it("strips expression() in values", () => {
      //* Arrange
      const css = `.lp-page-bg { width: expression(document.body.clientWidth); }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("expression");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips url(javascript:) values", () => {
      //* Arrange
      const css = `.lp-page-bg { background: url(javascript:alert(1)); }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("javascript");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips url(data:) values", () => {
      //* Arrange
      const css = `.lp-page-bg { background: url(data:text/html,<script>alert(1)</script>); }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("data:");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips -moz-binding property", () => {
      //* Arrange
      const css = `.lp-page-bg { -moz-binding: url(evil.xml#xss); }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("-moz-binding");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips behavior property", () => {
      //* Arrange
      const css = `.lp-page-bg { behavior: url(evil.htc); }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("behavior");
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("external resource loading", () => {
    it("strips @import rules", () => {
      //* Arrange
      const css = `@import url("https://evil.com/track.css"); .lp-page-bg { color: red; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("@import");
      expect(result.sanitized).toContain("color: red");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips @font-face rules", () => {
      //* Arrange
      const css = `@font-face { font-family: evil; src: url(https://evil.com/font.woff2); } .lp-page-bg { color: red; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("@font-face");
      expect(result.sanitized).toContain("color: red");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips @media queries", () => {
      //* Arrange
      const css = `@media (max-width: 768px) { .lp-page-bg { display: block; } }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("@media");
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("layout/positioning attacks", () => {
    it("strips position: fixed", () => {
      //* Arrange
      const css = `.lp-page-bg .overlay { position: fixed; top: 0; left: 0; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("position");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips position: absolute", () => {
      //* Arrange
      const css = `.lp-page-bg .overlay { position: absolute; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("position");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("allows position: relative", () => {
      //* Arrange
      const css = `.lp-page-bg .card { position: relative; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).toContain("position: relative");
      expect(result.errors).toHaveLength(0);
    });

    it("strips z-index", () => {
      //* Arrange
      const css = `.lp-page-bg .overlay { z-index: 9999; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("z-index");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips content property", () => {
      //* Arrange
      const css = `.lp-page-bg::before { content: "phishing"; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("content");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips pointer-events", () => {
      //* Arrange
      const css = `.lp-page-bg { pointer-events: none; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("pointer-events");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips cursor", () => {
      //* Arrange
      const css = `.lp-page-bg a { cursor: pointer; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("cursor");
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("visibility manipulation", () => {
    it("strips visibility", () => {
      //* Arrange
      const css = `.lp-page-bg .footer { visibility: hidden; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("visibility");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips display: none", () => {
      //* Arrange
      const css = `.lp-page-bg .branding { display: none; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("display");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("allows display: flex", () => {
      //* Arrange
      const css = `.lp-page-bg .card { display: flex; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).toContain("display: flex");
      expect(result.errors).toHaveLength(0);
    });

    it("strips clip-path", () => {
      //* Arrange
      const css = `.lp-page-bg { clip-path: circle(0); }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("clip-path");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips clip", () => {
      //* Arrange
      const css = `.lp-page-bg { clip: rect(0, 0, 0, 0); }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("clip");
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("breakout / overflow", () => {
    it("strips overflow", () => {
      //* Arrange
      const css = `.lp-page-bg { overflow: hidden; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("overflow");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips resize", () => {
      //* Arrange
      const css = `.lp-page-bg textarea { resize: both; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("resize");
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("selector restrictions", () => {
    it("rejects selectors not scoped to .lp-page-bg", () => {
      //* Arrange
      const css = `.some-other-class { color: red; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("color");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("rejects html selector", () => {
      //* Arrange
      const css = `html { background: red; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("background");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("rejects body selector", () => {
      //* Arrange
      const css = `body { margin: 0; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("margin");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("rejects :root selector", () => {
      //* Arrange
      const css = `:root { --evil: red; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("--evil");
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("edge cases", () => {
    it("handles malformed CSS without throwing", () => {
      //* Arrange
      const css = `.lp-page-bg { color: red; /* unclosed comment`;

      //* Act
      const act = () => sanitizeCss(css);

      //* Assert
      expect(act).not.toThrow();
    });

    it("handles CSS with multiple rules, stripping only bad ones", () => {
      //* Arrange
      const css = `.lp-page-bg { color: red; } .lp-page-bg { position: fixed; } .lp-page-bg .link { font-size: 14px; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).toContain("color: red");
      expect(result.sanitized).toContain("font-size: 14px");
      expect(result.sanitized).not.toContain("position");
    });

    it("handles unicode escapes for blacklisted properties", () => {
      //* Arrange — \70osition is "position" via CSS unicode escape
      const css = `.lp-page-bg { \\70osition: fixed; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("fixed");
    });
  });
});
