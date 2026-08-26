import { describe, expect, it } from "vitest";
import { rosterStatusLabel } from "./utils";

describe("rosterStatusLabel", () => {
  it("keeps Off track while a Soft stumble day is still incomplete", () => {
    //* Act
    const label = rosterStatusLabel({
      dayComplete: false,
      mode: "soft",
      softStumble: true,
      status: "active",
    });

    //* Assert
    expect(label).toBe("offTrack");
  });

  it("removes Off track when the last task for the day is complete", () => {
    //* Act
    const label = rosterStatusLabel({
      dayComplete: true,
      mode: "soft",
      softStumble: true,
      status: "active",
    });

    //* Assert
    expect(label).toBeNull();
  });

  it("keeps Failed above Off track", () => {
    //* Act
    const label = rosterStatusLabel({
      dayComplete: true,
      mode: "soft",
      softStumble: true,
      status: "failed",
    });

    //* Assert
    expect(label).toBe("failed");
  });
});
