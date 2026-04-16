import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password utils", () => {
  it("hashes a password and verifies it correctly", async () => {
    //* Arrange
    const password = "testPassword123!";

    //* Act
    const hash = await hashPassword(password);

    //* Assert
    expect(hash).not.toBe(password);
    expect(await verifyPassword(password, hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    //* Arrange
    const hash = await hashPassword("correctPassword");

    //* Act
    const result = await verifyPassword("wrongPassword", hash);

    //* Assert
    expect(result).toBe(false);
  });

  it("produces different hashes for the same password (salted)", async () => {
    //* Arrange
    const password = "samePassword";

    //* Act
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    //* Assert
    expect(hash1).not.toBe(hash2);
    // But both should verify
    expect(await verifyPassword(password, hash1)).toBe(true);
    expect(await verifyPassword(password, hash2)).toBe(true);
  });
});
