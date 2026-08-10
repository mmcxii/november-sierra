import { describe, expect, it } from "vitest";
import { formatTimeZoneOption, listTimeZones, timeZoneOptions } from "./timezones";

describe("listTimeZones", () => {
  it("returns a non-empty list including UTC or common zones", () => {
    //* Arrange
    const minimumZones = 10;

    //* Act
    const zones = listTimeZones();

    //* Assert
    expect(zones.length).toBeGreaterThan(minimumZones);
    expect(zones.includes("UTC") || zones.includes("America/New_York")).toBe(true);
  });
});

describe("timeZoneOptions", () => {
  it("keeps an unknown preferred zone in the list", () => {
    //* Arrange
    const preferred = "Etc/Unknown-Test-Zone";

    //* Act
    const options = timeZoneOptions(preferred);

    //* Assert
    expect(options[0]).toBe(preferred);
    expect(options).toContain(preferred);
  });
});

describe("formatTimeZoneOption", () => {
  it("includes the zone id in the label", () => {
    //* Arrange
    const timeZone = "America/New_York";

    //* Act
    const label = formatTimeZoneOption(timeZone, new Date("2026-01-15T12:00:00.000Z"));

    //* Assert
    expect(label).toContain("America/New York");
  });
});
