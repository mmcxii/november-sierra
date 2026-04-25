import { db } from "@/lib/db/client";
import { betterAuthAccountTable } from "@/lib/db/schema/better-auth";
import { eq } from "drizzle-orm";
import { hashPassword, isBcryptHash, verifyPassword } from "./password";

// BA's `password.verify` hook returns boolean only. To upgrade Clerk-imported
// bcrypt hashes to argon2id on successful sign-in we wrap verifyPassword here:
// pure verify lives in password.ts (DB-free, easy to unit test), the
// side-effecting upgrade lives here.
//
// Bcrypt salts are random per-hash, so the hash itself uniquely identifies the
// account row — updating `WHERE password = oldHash` matches exactly one row.
// Failures are swallowed (and logged) because a successful sign-in must not
// depend on the upgrade succeeding; the user gets in either way and the next
// sign-in retries the upgrade automatically.
export async function verifyPasswordWithRehash({
  hash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  const ok = await verifyPassword({ hash, password });
  if (!ok || !isBcryptHash(hash)) {
    return ok;
  }

  try {
    const newHash = await hashPassword(password);
    await db
      .update(betterAuthAccountTable)
      .set({ password: newHash, updatedAt: new Date() })
      .where(eq(betterAuthAccountTable.password, hash));
  } catch (error) {
    console.error("[password] failed to upgrade bcrypt → argon2id hash", error);
  }

  return ok;
}
