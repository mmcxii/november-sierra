import { describe, expect, it } from "vitest";
import { canStepDate, formatStepperDateLabel, stepperMaxDate } from "./utils";

describe("formatStepperDateLabel", () => {
  it("formats as weekday, month day", () => {
    //* Arrange
    const dateOnly = "2026-08-09";

    //* Act
    const label = formatStepperDateLabel(dateOnly);

    //* Assert
    expect(label).toBe("SUN, AUG 9");
  });
});

describe("stepperMaxDate", () => {
  it("uses today when before end date", () => {
    //* Arrange
    const todayLocal = "2026-08-10";
    const endDate = "2026-10-24";

    //* Act
    const max = stepperMaxDate(todayLocal, endDate);

    //* Assert
    expect(max).toBe("2026-08-10");
  });

  it("uses end date when today is after the challenge", () => {
    //* Arrange
    const todayLocal = "2026-11-01";
    const endDate = "2026-10-24";

    //* Act
    const max = stepperMaxDate(todayLocal, endDate);

    //* Assert
    expect(max).toBe("2026-10-24");
  });
});

describe("canStepDate", () => {
  it("blocks stepping before start or past today/end", () => {
    //* Arrange
    const bounds = {
      endDate: "2026-10-24",
      selectedDate: "2026-08-11",
      startDate: "2026-08-11",
      todayLocal: "2026-08-12",
    };

    //* Act
    const canGoBack = canStepDate({ ...bounds, direction: -1 });
    const canGoForward = canStepDate({ ...bounds, direction: 1 });
    const canGoPastToday = canStepDate({
      ...bounds,
      direction: 1,
      selectedDate: "2026-08-12",
    });

    //* Assert
    expect(canGoBack).toBe(false);
    expect(canGoForward).toBe(true);
    expect(canGoPastToday).toBe(false);
  });
});
