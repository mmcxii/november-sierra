import { describe, expect, it } from "vitest";
import { sanitizeCss } from "./css-sanitizer";

describe("sanitizeCss", () => {
  describe("valid CSS", () => {
    it("passes valid scoped CSS through unchanged", () => {
      //* Arrange
      const css = `.anchr-page .card { color: red; background: blue; }`;

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

    it("allows nested selectors under .anchr-page", () => {
      //* Arrange
      const css = `.anchr-page a:hover { text-decoration: underline; }`;

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
      const css = `.anchr-page { width: expression(document.body.clientWidth); }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("expression");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips url(javascript:) values", () => {
      //* Arrange
      const css = `.anchr-page { background: url(javascript:alert(1)); }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("javascript");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips url(data:) values", () => {
      //* Arrange
      const css = `.anchr-page { background: url(data:text/html,<script>alert(1)</script>); }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("data:");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips -moz-binding property", () => {
      //* Arrange
      const css = `.anchr-page { -moz-binding: url(evil.xml#xss); }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("-moz-binding");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips behavior property", () => {
      //* Arrange
      const css = `.anchr-page { behavior: url(evil.htc); }`;

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
      const css = `@import url("https://evil.com/track.css"); .anchr-page { color: red; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("@import");
      expect(result.sanitized).toContain("color: red");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips @font-face rules", () => {
      //* Arrange
      const css = `@font-face { font-family: evil; src: url(https://evil.com/font.woff2); } .anchr-page { color: red; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("@font-face");
      expect(result.sanitized).toContain("color: red");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips @media queries", () => {
      //* Arrange
      const css = `@media (max-width: 768px) { .anchr-page { display: block; } }`;

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
      const css = `.anchr-page .overlay { position: fixed; top: 0; left: 0; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("position");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips position: absolute", () => {
      //* Arrange
      const css = `.anchr-page .overlay { position: absolute; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("position");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("allows position: relative", () => {
      //* Arrange
      const css = `.anchr-page .card { position: relative; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).toContain("position: relative");
      expect(result.errors).toHaveLength(0);
    });

    it("strips z-index", () => {
      //* Arrange
      const css = `.anchr-page .overlay { z-index: 9999; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("z-index");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips content property", () => {
      //* Arrange
      const css = `.anchr-page::before { content: "phishing"; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("content");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips pointer-events", () => {
      //* Arrange
      const css = `.anchr-page { pointer-events: none; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("pointer-events");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips cursor", () => {
      //* Arrange
      const css = `.anchr-page a { cursor: pointer; }`;

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
      const css = `.anchr-page .footer { visibility: hidden; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("visibility");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips display: none", () => {
      //* Arrange
      const css = `.anchr-page .branding { display: none; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("display");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("allows display: flex", () => {
      //* Arrange
      const css = `.anchr-page .card { display: flex; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).toContain("display: flex");
      expect(result.errors).toHaveLength(0);
    });

    it("strips clip-path", () => {
      //* Arrange
      const css = `.anchr-page { clip-path: circle(0); }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("clip-path");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips clip", () => {
      //* Arrange
      const css = `.anchr-page { clip: rect(0, 0, 0, 0); }`;

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
      const css = `.anchr-page { overflow: hidden; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("overflow");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("strips resize", () => {
      //* Arrange
      const css = `.anchr-page textarea { resize: both; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("resize");
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("selector restrictions", () => {
    it("rejects selectors not scoped to .anchr-page", () => {
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

    it("accepts any .anchr- prefixed class as selector", () => {
      //* Arrange
      const css = `.anchr-link { color: red; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).toContain("color: red");
      expect(result.errors).toHaveLength(0);
    });

    it("accepts pseudo-classes on .anchr- selectors", () => {
      //* Arrange
      const css = `.anchr-link:hover { color: blue; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).toContain("color: blue");
      expect(result.errors).toHaveLength(0);
    });

    it("accepts combinators between .anchr- selectors", () => {
      //* Arrange
      const css = `.anchr-link + .anchr-link { margin-top: 8px; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).toContain("margin-top: 8px");
      expect(result.errors).toHaveLength(0);
    });

    it("accepts descendant .anchr- selectors", () => {
      //* Arrange
      const css = `.anchr-page .anchr-avatar { border-radius: 0; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).toContain("border-radius: 0");
      expect(result.errors).toHaveLength(0);
    });

    it("rejects selectors without .anchr- prefix", () => {
      //* Arrange
      const css = `.random-class { color: red; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("color");
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("edge cases", () => {
    it("handles malformed CSS without throwing", () => {
      //* Arrange
      const css = `.anchr-page { color: red; /* unclosed comment`;

      //* Act
      const act = () => sanitizeCss(css);

      //* Assert
      expect(act).not.toThrow();
    });

    it("handles CSS with multiple rules, stripping only bad ones", () => {
      //* Arrange
      const css = `.anchr-page { color: red; } .anchr-page { position: fixed; } .anchr-page .link { font-size: 14px; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).toContain("color: red");
      expect(result.sanitized).toContain("font-size: 14px");
      expect(result.sanitized).not.toContain("position");
    });

    it("handles unicode escapes for blacklisted properties", () => {
      //* Arrange — \70osition is "position" via CSS unicode escape
      const css = `.anchr-page { \\70osition: fixed; }`;

      //* Act
      const result = sanitizeCss(css);

      //* Assert
      expect(result.sanitized).not.toContain("fixed");
    });
  });
});
