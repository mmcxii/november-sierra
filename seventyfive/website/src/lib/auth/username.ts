const USERNAME_MAX = 30;

/** Coerce a display name into a username base (lowercase alphanumerics). */
export function usernameBaseFromDisplayName(displayName: string): string {
  const cleaned = displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, USERNAME_MAX);
  return cleaned.length >= 3 ? cleaned : `user${cleaned}`.padEnd(3, "0").slice(0, USERNAME_MAX);
}

export function syntheticEmailForUsername(username: string): string {
  return `${username}@users.seventyfive.local`;
}

export function generateAccountPassword(): string {
  const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => {
    return alphabet[byte % alphabet.length];
  }).join("");
}

export { USERNAME_MAX };
