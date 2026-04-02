import { describe, expect, it } from "vitest";
import { metadata } from "./page";

describe("/docs page", () => {
  it("metadata snapshot", () => {
    //* Act
    const result = metadata;

    //* Assert
    expect(result).toMatchInlineSnapshot(`
      {
        "description": "Interactive API documentation for the Anchr REST API. Explore endpoints, try requests, and integrate with your applications.",
        "openGraph": {
          "description": "Interactive API documentation for the Anchr REST API. Explore endpoints, try requests, and integrate with your applications.",
          "title": "Anchr API Docs",
          "type": "website",
        },
        "title": "API Docs",
        "twitter": {
          "card": "summary_large_image",
          "description": "Interactive API documentation for the Anchr REST API. Explore endpoints, try requests, and integrate with your applications.",
          "title": "Anchr API Docs",
        },
      }
    `);
  });
});
