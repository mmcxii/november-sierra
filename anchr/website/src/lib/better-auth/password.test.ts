import { hash as bcryptHash } from "bcryptjs";
import { describe, expect, it } from "vitest";
import { hashPassword, isArgon2Hash, isBcryptHash, verifyPassword } from "./password";

describe("password dual-hash", () => {
  it("round-trips argon2id", async () => {
    //* Arrange
    const password = "hunter2ishunter2";

    //* Act
    const hash = await hashPassword(password);

    //* Assert
    expect(isArgon2Hash(hash)).toBe(true);
    expect(await verifyPassword({ hash, password })).toBe(true);
    expect(await verifyPassword({ hash, password: "wrong" })).toBe(false);
  });

  it("verifies bcrypt hashes (the Clerk export format)", async () => {
    //* Arrange
    const password = "hunter2";
    const hash = await bcryptHash(password, 10);

    //* Act
    const ok = await verifyPassword({ hash, password });
    const wrong = await verifyPassword({ hash, password: "hunter3" });

    //* Assert
    expect(isBcryptHash(hash)).toBe(true);
    expect(ok).toBe(true);
    expect(wrong).toBe(false);
  });

  it("rejects unknown hash formats without error", async () => {
    //* Arrange
    const hash = "not-a-hash";

    //* Act
    const result = await verifyPassword({ hash, password: "anything" });

    //* Assert
    expect(result).toBe(false);
  });
});
