import { hash as argon2Hash, verify as argon2Verify } from "@node-rs/argon2";
import { compare as bcryptCompare } from "bcryptjs";

// OWASP-recommended argon2id parameters as of 2026: time cost 3, memory
// cost 64 MiB, parallelism 4. Each hash takes ~500ms on modern hardware;
// deliberately so. Tests override these via the weaker params below to
// keep suites fast without losing format correctness (argon2id $ prefix,
// verify round-trip). NODE_ENV === "test" is the signal — both vitest and
// the Node test runner set it before entry.
const PROD_ARGON2_OPTIONS = {
  memoryCost: 65536,
  outputLen: 32,
  parallelism: 4,
  timeCost: 3,
} as const;

const TEST_ARGON2_OPTIONS = {
  memoryCost: 8,
  outputLen: 32,
  parallelism: 1,
  timeCost: 1,
} as const;

const ARGON2_OPTIONS = process.env.NODE_ENV === "test" ? TEST_ARGON2_OPTIONS : PROD_ARGON2_OPTIONS;

export async function hashPassword(password: string): Promise<string> {
  return argon2Hash(password, ARGON2_OPTIONS);
}

export function isBcryptHash(hash: string): boolean {
  return hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$");
}

export function isArgon2Hash(hash: string): boolean {
  return hash.startsWith("$argon2");
}

// Verifies a password against a stored hash, supporting both argon2id (native)
// and bcrypt (migrated from Clerk). Callers should re-hash bcrypt passwords
// with argon2id on successful verify so the next sign-in uses the modern algo.
export async function verifyPassword({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  if (isBcryptHash(hash)) {
    return bcryptCompare(password, hash);
  }
  if (isArgon2Hash(hash)) {
    return argon2Verify(hash, password);
  }
  // Unknown format — reject without leaking details to the caller.
  return false;
}
