import { afterEach, describe, expect, it, vi } from "vitest";
import { scrollWindowToTop } from "./utils";

describe("scrollWindowToTop", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves immediately when already at the top", async () => {
    //* Arrange
    const scrollTo = vi.fn();
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      scrollTo,
      scrollY: 0,
      matchMedia: () => {
        return { matches: false };
      },
    });

    //* Act
    await scrollWindowToTop();

    //* Assert
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("jumps instantly when the user prefers reduced motion", async () => {
    //* Arrange
    const scrollTo = vi.fn();
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      scrollTo,
      scrollY: 480,
      matchMedia: () => {
        return { matches: true };
      },
    });

    //* Act
    await scrollWindowToTop();

    //* Assert
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });
});
