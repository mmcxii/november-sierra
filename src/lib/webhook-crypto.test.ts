import { createHmac, randomBytes } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

// Mock envSchema before importing the module under test
const TEST_KEY = randomBytes(32).toString("hex");

vi.mock("./env", () => {
  return {
    envSchema: {
      WEBHOOK_SIGNING_ENCRYPTION_KEY: TEST_KEY,
    },
  };
});

const { decryptSecret, encryptSecret, generateSigningSecret, signPayload } = await import("./webhook-crypto");

describe("generateSigningSecret", () => {
  it("produces a 64-character hex string", () => {
    //* Act
    const secret = generateSigningSecret();

    //* Assert
    expect(secret).toHaveLength(64);
    expect(secret).toMatch(/^[a-f0-9]+$/);
  });
});

describe("encryptSecret / decryptSecret", () => {
  it("round-trips: encrypt then decrypt returns the original secret", () => {
    //* Arrange
    const original = generateSigningSecret();

    //* Act
    const encrypted = encryptSecret(original);
    const decrypted = decryptSecret(encrypted);

    //* Assert
    expect(decrypted).toBe(original);
  });

  it("produces different ciphertext for the same input (random IV)", () => {
    //* Arrange
    const secret = generateSigningSecret();

    //* Act
    const encrypted1 = encryptSecret(secret);
    const encrypted2 = encryptSecret(secret);

    //* Assert
    expect(encrypted1).not.toBe(encrypted2);
  });

  it("fails to decrypt with a tampered ciphertext", () => {
    //* Arrange
    const secret = generateSigningSecret();
    const encrypted = encryptSecret(secret);
    const tampered = encrypted.slice(0, -2) + "AA";

    //* Act
    const act = () => {
      return decryptSecret(tampered);
    };

    //* Assert
    expect(act).toThrow();
  });
});

describe("signPayload", () => {
  it("produces a verifiable HMAC-SHA256 signature", () => {
    //* Arrange
    const payload = JSON.stringify({ event: "link.created", timestamp: "2026-01-01T00:00:00Z" });
    const secret = generateSigningSecret();

    //* Act
    const signature = signPayload(payload, secret);

    //* Assert — verify using Node crypto directly
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    expect(signature).toBe(expected);
  });
});
