// Pure helper extracted from user-bootstrap so test files that exercise it
// don't transitively pull in the DB layer (and therefore env validation).
export function generateUsername(email: string, name: null | string): string {
  const base =
    name != null ? name.toLowerCase().replace(/[^a-z0-9]/g, "") : email.split("@")[0].replace(/[^a-z0-9]/g, "");

  const suffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return `${base}${suffix}`;
}
