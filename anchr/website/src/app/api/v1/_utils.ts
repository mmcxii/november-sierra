/**
 * Parse optional `start` and `end` query params into Date objects.
 */
export function parseDateRange(url: URL): { end: null | Date; start: null | Date } {
  const startParam = url.searchParams.get("start");
  const endParam = url.searchParams.get("end");

  let start: null | Date = null;
  let end: null | Date = null;

  if (startParam != null) {
    const d = new Date(startParam);
    if (!isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      start = d;
    }
  }

  if (endParam != null) {
    const d = new Date(endParam);
    if (!isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      end = d;
    }
  }

  return { end, start };
}
