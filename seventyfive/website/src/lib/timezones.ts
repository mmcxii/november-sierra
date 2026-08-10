/** Fallback IANA zones when `Intl.supportedValuesOf` is unavailable. */
const FALLBACK_TIME_ZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Stockholm",
  "Europe/Moscow",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
] as const;

export function listTimeZones(): string[] {
  try {
    if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
      return Intl.supportedValuesOf("timeZone");
    }
  } catch {
    // fall through
  }
  return [...FALLBACK_TIME_ZONES];
}

export function formatTimeZoneOption(timeZone: string, now = new Date()): string {
  try {
    const offset =
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        timeZoneName: "shortOffset",
      })
        .formatToParts(now)
        .find((part) => {
          return part.type === "timeZoneName";
        })?.value ?? "";

    if (offset !== "") {
      return `${timeZone.replaceAll("_", " ")} (${offset})`;
    }
  } catch {
    // fall through
  }
  return timeZone.replaceAll("_", " ");
}

/** Ensure a saved/detected zone appears in the option list. */
export function timeZoneOptions(preferred?: null | string): string[] {
  const zones = listTimeZones();
  if (preferred == null || preferred === "" || zones.includes(preferred)) {
    return zones;
  }
  return [preferred, ...zones];
}
