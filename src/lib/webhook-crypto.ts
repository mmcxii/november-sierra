import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { envSchema } from "./env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  return Buffer.from(envSchema.WEBHOOK_SIGNING_ENCRYPTION_KEY, "hex");
}

/**
 * Generate a random signing secret for a new webhook.
 * Returns the raw hex secret (shown to the user once).
 */
export function generateSigningSecret(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Encrypt a signing secret for storage in the database.
 * Format: base64(iv + ciphertext + authTag)
 */
export function encryptSecret(rawSecret: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(rawSecret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, encrypted, authTag]).toString("base64");
}

/**
 * Decrypt a signing secret from the database.
 */
export function decryptSecret(encryptedSecret: string): string {
  const key = getEncryptionKey();
  const data = Buffer.from(encryptedSecret, "base64");

  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(data.length - AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH, data.length - AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return decipher.update(ciphertext) + decipher.final("utf8");
}

/**
 * Sign a webhook payload with HMAC-SHA256.
 * Returns the hex-encoded signature for the X-Anchr-Signature-256 header.
 */
export function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}
