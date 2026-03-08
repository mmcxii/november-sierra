export function generateUsername(email: string, name: null | string): string {
  const base = name ? name.toLowerCase().replace(/[^a-z0-9]/g, "") : email.split("@")[0].replace(/[^a-z0-9]/g, "");

  const suffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return `${base}${suffix}`;
}
