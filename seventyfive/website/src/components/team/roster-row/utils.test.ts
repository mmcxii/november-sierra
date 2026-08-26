import { describe, expect, it } from "vitest";
import { rosterStatusLabel } from "./utils";

describe("rosterStatusLabel", () => {
  it("shows Off track while a Soft member is currently stumbling", () => {
    //* Act
    const label = rosterStatusLabel({
      mode: "soft",
      softStumble: true,
      status: "active",
    });

    //* Assert
    expect(label).toBe("offTrack");
  });

  it("hides Off track when the stumble has cleared", () => {
    //* Act
    const label = rosterStatusLabel({
      mode: "soft",
      softStumble: false,
      status: "active",
    });

    //* Assert
    expect(label).toBeNull();
  });

  it("keeps Failed above Off track", () => {
    //* Act
    const label = rosterStatusLabel({
      mode: "soft",
      softStumble: true,
      status: "failed",
    });

    //* Assert
    expect(label).toBe("failed");
  });
});
