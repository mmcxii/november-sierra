/** Calendar YYYY-MM-DD in the browser's local timezone. */
export function browserLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Default create start date: tomorrow in the browser's local timezone. */
export function defaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return browserLocalDateString(date);
}
