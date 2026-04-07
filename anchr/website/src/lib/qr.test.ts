import { describe, expect, it } from "vitest";
import { buildAnchorSvgUrl } from "./qr";

describe("buildAnchorSvgUrl", () => {
  it("uses the light (default) roundel colors in the SVG", () => {
    //* Act
    const result = buildAnchorSvgUrl(64);
    const decoded = decodeURIComponent(result.replace("data:image/svg+xml;charset=utf-8,", ""));

    //* Assert
    expect(decoded).toContain('fill="#1e2d42"');
    expect(decoded).toContain('stroke="#d4b896"');
  });

  it("uses the dark (inverted) roundel colors when style is dark", () => {
    //* Act
    const result = buildAnchorSvgUrl(64, "dark");
    const decoded = decodeURIComponent(result.replace("data:image/svg+xml;charset=utf-8,", ""));

    //* Assert
    expect(decoded).toContain('fill="#0a1729"');
    expect(decoded).toContain('stroke="#d4b896"');
  });

  it("embeds the specified size in the SVG", () => {
    //* Act
    const result = buildAnchorSvgUrl(128);
    const decoded = decodeURIComponent(result.replace("data:image/svg+xml;charset=utf-8,", ""));

    //* Assert
    expect(decoded).toContain('width="128"');
    expect(decoded).toContain('height="128"');
  });
});
