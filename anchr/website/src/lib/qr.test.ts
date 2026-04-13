import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildAnchorSvgUrl, downloadQrPng, LOGO_RATIO, type QrLogo } from "./qr";

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

describe("downloadQrPng", () => {
  // ── DOM stubs ──────────────────────────────────────────────────────────
  const mockCtx = {
    arc: vi.fn(),
    beginPath: vi.fn(),
    clip: vi.fn(),
    closePath: vi.fn(),
    drawImage: vi.fn(),
    restore: vi.fn(),
    save: vi.fn(),
  };

  const mockOutputCanvas = {
    getContext: vi.fn(() => mockCtx),
    height: 0,
    toDataURL: vi.fn(() => "data:image/png;base64,mock"),
    width: 0,
  };

  const mockAnchor = { click: vi.fn(), download: "", href: "" };

  let capturedImage: {
    crossOrigin?: null | string;
    onerror?: null | (() => void);
    onload?: null | (() => void);
    src?: string;
  };

  const stubCreateElement = vi.fn((tag: string) => {
    if (tag === "canvas") {
      return mockOutputCanvas;
    }
    if (tag === "a") {
      return mockAnchor;
    }
    return {};
  });

  beforeEach(() => {
    vi.clearAllMocks();
    capturedImage = {};
    mockAnchor.download = "";
    mockAnchor.href = "";
    mockOutputCanvas.getContext.mockReturnValue(mockCtx);

    class MockImage {
      crossOrigin: null | string = null;
      onerror: null | (() => void) = null;
      onload: null | (() => void) = null;

      set src(val: string) {
        capturedImage = {
          crossOrigin: this.crossOrigin,
          onerror: this.onerror,
          onload: this.onload,
          src: val,
        };
      }
    }

    vi.stubGlobal("Image", MockImage);
    vi.stubGlobal("document", {
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
      createElement: stubCreateElement,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // ── Helpers ──────────────────────────────────────────────────────────
  const makeQrCanvas = (size: number) => {
    return { width: size } as unknown as HTMLCanvasElement;
  };

  // ── Tests ────────────────────────────────────────────────────────────
  it("resolves and triggers download when no logo is provided", async () => {
    //* Act
    await downloadQrPng(makeQrCanvas(512), "test-qr");

    //* Assert
    expect(mockAnchor.click).toHaveBeenCalledOnce();
    expect(mockAnchor.download).toBe("test-qr.png");
  });

  it("composites logo onto canvas when image loads successfully", async () => {
    //* Arrange
    const logo: QrLogo = { src: "data:image/svg+xml,<svg/>" };
    const promise = downloadQrPng(makeQrCanvas(512), "test-qr", logo);

    //* Act — simulate image load
    capturedImage.onload?.();

    //* Assert
    await expect(promise).resolves.toBeUndefined();
    const expectedLogoSize = Math.round(512 * LOGO_RATIO);
    const expectedOffset = Math.round((512 - expectedLogoSize) / 2);
    expect(mockCtx.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      expectedOffset,
      expectedOffset,
      expectedLogoSize,
      expectedLogoSize,
    );
    expect(mockAnchor.click).toHaveBeenCalledOnce();
  });

  it("applies circular clip path when logo.circular is true", async () => {
    //* Arrange
    const logo: QrLogo = { circular: true, src: "https://example.com/avatar.jpg" };
    const promise = downloadQrPng(makeQrCanvas(512), "test-qr", logo);

    //* Act
    capturedImage.onload?.();

    //* Assert
    await expect(promise).resolves.toBeUndefined();
    expect(mockCtx.save).toHaveBeenCalledOnce();
    expect(mockCtx.beginPath).toHaveBeenCalledOnce();
    expect(mockCtx.arc).toHaveBeenCalledWith(256, 256, Math.round(512 * LOGO_RATIO) / 2, 0, Math.PI * 2);
    expect(mockCtx.clip).toHaveBeenCalledOnce();
    expect(mockCtx.restore).toHaveBeenCalledOnce();
  });

  it("does not clip when logo.circular is falsy", async () => {
    //* Arrange
    const logo: QrLogo = { src: "data:image/svg+xml,<svg/>" };
    const promise = downloadQrPng(makeQrCanvas(512), "test-qr", logo);

    //* Act
    capturedImage.onload?.();

    //* Assert
    await expect(promise).resolves.toBeUndefined();
    expect(mockCtx.clip).not.toHaveBeenCalled();
  });

  it("sets crossOrigin to anonymous for CORS compatibility", async () => {
    //* Arrange
    const logo: QrLogo = { src: "https://cdn.example.com/avatar.png" };

    //* Act
    void downloadQrPng(makeQrCanvas(512), "test-qr", logo);

    //* Assert
    expect(capturedImage.crossOrigin).toBe("anonymous");
  });

  it("still triggers download and rejects when image fails to load", async () => {
    //* Arrange
    const logo: QrLogo = { src: "https://broken.example.com/missing.png" };
    const promise = downloadQrPng(makeQrCanvas(512), "test-qr", logo);

    //* Act — simulate image error
    capturedImage.onerror?.();

    //* Assert
    await expect(promise).rejects.toThrow("Failed to load logo image");
    expect(mockAnchor.click).toHaveBeenCalledOnce();
  });

  it("rejects when canvas context is unavailable", async () => {
    //* Arrange
    mockOutputCanvas.getContext.mockReturnValueOnce(null as unknown as typeof mockCtx);

    //* Act
    const promise = downloadQrPng(makeQrCanvas(512), "test-qr");

    //* Assert
    await expect(promise).rejects.toThrow("Failed to get canvas context");
  });
});
