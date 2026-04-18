import { describe, expect, it } from "vitest";
import { metadata } from "./page";

describe("/short-links page", () => {
  it("exports correct metadata title", () => {
    //* Act
    const title = metadata.title;

    //* Assert
    expect(title).toBe("URL Shortener");
  });

  it("exports correct metadata description", () => {
    //* Act
    const description = metadata.description;

    //* Assert — must advertise both the anch.to surface and the self-serve
    //  brand-domain upgrade path, so cold-from-search visitors understand
    //  the product's two operating modes before clicking through.
    expect(description).toContain("anch.to");
    expect(description).toContain("your own domain");
  });

  it("advertises Pro pricing in metadata description for SERP preview", () => {
    //* Act
    const description = metadata.description;

    //* Assert — the price lives in the description so the snippet Google
    //  renders for "url shortener free" queries already shows the free-tier
    //  + $7/mo hook.
    expect(description).toContain("$7/mo Pro");
  });
});
