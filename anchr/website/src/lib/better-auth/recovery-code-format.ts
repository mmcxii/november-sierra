export const RECOVERY_CODE_COUNT = 10;
const GROUP_CHARS = 5;
// Crockford base32 alphabet — drops I/L/O/U to avoid handwriting ambiguity.
const BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function randomGroup(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(GROUP_CHARS));
  let out = "";
  for (const b of bytes) {
    out += BASE32[b % BASE32.length];
  }
  return out;
}

export function generateRecoveryCode(): string {
  return `${randomGroup()}-${randomGroup()}`;
}

export function normalizeRecoveryCode(input: string): string {
  return input.replace(/\s+/g, "").replace(/-/g, "").toUpperCase();
}
