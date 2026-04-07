import { describe, expect, it } from "vitest";
import { metadata } from "./page";

describe("/developers page", () => {
  it("exports correct metadata title", () => {
    //* Act
    const title = metadata.title;

    //* Assert
    expect(title).toBe("Developers");
  });

  it("exports correct metadata description", () => {
    //* Act
    const description = metadata.description;

    //* Assert
    expect(description).toContain("AI agents");
  });

  it("exports OpenGraph metadata", () => {
    //* Act
    const og = metadata.openGraph;

    //* Assert
    expect(og).toBeDefined();
    expect(og).toHaveProperty("title", "Anchr for Developers");
  });

  it("exports Twitter card metadata", () => {
    //* Act
    const twitter = metadata.twitter;

    //* Assert
    expect(twitter).toBeDefined();
    expect(twitter).toHaveProperty("title", "Anchr for Developers");
    expect(twitter).toHaveProperty("card", "summary_large_image");
  });

  it("metadata snapshot", () => {
    //* Act
    const result = metadata;

    //* Assert
    expect(result).toMatchInlineSnapshot(`
      {
        "description": "Anchr is the link-in-bio platform built for AI agents. Public REST API, JSON-LD structured data, MCP server, and discovery files.",
        "openGraph": {
          "description": "Public REST API, JSON-LD structured data, MCP server, and discovery files. The link-in-bio your AI assistant can manage.",
          "title": "Anchr for Developers",
          "type": "website",
        },
        "title": "Developers",
        "twitter": {
          "card": "summary_large_image",
          "description": "Public REST API, JSON-LD structured data, MCP server, and discovery files. The link-in-bio your AI assistant can manage.",
          "title": "Anchr for Developers",
        },
      }
    `);
  });
});
