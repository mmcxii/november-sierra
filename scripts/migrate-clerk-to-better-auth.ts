import "dotenv/config";
import { createClerkClient } from "@clerk/backend";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { readFileSync } from "node:fs";
import {
  type ClerkUserFixture,
  type MigrateClerkUsersResult,
  migrateClerkUsers,
} from "../anchr/website/src/lib/better-auth/migrate";

// CLI wrapper for the Clerk → Better Auth migration.
//
// Flags:
//   --dry-run        Print what would change; do not write.
//   --hashes <path>  Path to a JSON file of { [clerkUserId]: bcryptHash }
//                    exported from Clerk's dashboard. Users without a hash
//                    get a null password and must complete a password reset
//                    before signing in via BA.
//
// Re-runnable: idempotent per-user upserts live in migrateClerkUsers().

type Args = { dryRun: boolean; hashesPath: null | string };

function parseArgs(argv: string[]): Args {
  const out: Args = { dryRun: false, hashesPath: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") {
      out.dryRun = true;
    } else if (a === "--hashes") {
      out.hashesPath = argv[i + 1] ?? null;
      i++;
    }
  }
  return out;
}

async function main(): Promise<void> {
  const { dryRun, hashesPath } = parseArgs(process.argv.slice(2));
  console.log(`[migrate] mode=${dryRun ? "DRY-RUN" : "WRITE"} hashes=${hashesPath ?? "(none)"}`);

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  const databaseUrl = process.env.DATABASE_URL;
  if (clerkSecret == null || databaseUrl == null) {
    throw new Error("CLERK_SECRET_KEY and DATABASE_URL are required");
  }

  const clerk = createClerkClient({ secretKey: clerkSecret });
  const db = drizzle(neon(databaseUrl));

  let hashes: Record<string, string> = {};
  if (hashesPath != null) {
    hashes = JSON.parse(readFileSync(hashesPath, "utf8")) as Record<string, string>;
    console.log(`[migrate] loaded ${Object.keys(hashes).length} Clerk password hashes`);
  }

  // Page through Clerk and accumulate into the library function. Keeping the
  // paging in the CLI keeps the library testable without mocking pagination.
  const totals: MigrateClerkUsersResult = {
    accountsUpserted: 0,
    accountsWithPassword: 0,
    seen: 0,
    skippedNoEmail: 0,
    usersUpserted: 0,
  };
  const pageSize = 500;
  let offset = 0;
  while (true) {
    const { data } = await clerk.users.getUserList({ limit: pageSize, offset });
    if (data.length === 0) {
      break;
    }

    const pageResult = await migrateClerkUsers(db, {
      clerkHashes: hashes,
      dryRun,
      users: data.map<ClerkUserFixture>((u) => ({
        emailAddresses: u.emailAddresses.map((e) => ({
          emailAddress: e.emailAddress,
          verification: e.verification == null ? null : { status: e.verification.status },
        })),
        firstName: u.firstName,
        id: u.id,
        imageUrl: u.imageUrl,
        lastName: u.lastName,
      })),
    });

    totals.accountsUpserted += pageResult.accountsUpserted;
    totals.accountsWithPassword += pageResult.accountsWithPassword;
    totals.seen += pageResult.seen;
    totals.skippedNoEmail += pageResult.skippedNoEmail;
    totals.usersUpserted += pageResult.usersUpserted;

    if (data.length < pageSize) {
      break;
    }
    offset += pageSize;
  }

  console.log("[migrate] done");
  console.log(`  users seen:             ${totals.seen}`);
  console.log(`  skipped (no email):     ${totals.skippedNoEmail}`);
  console.log(`  BA users upserted:      ${totals.usersUpserted}`);
  console.log(`  BA accounts upserted:   ${totals.accountsUpserted}`);
  console.log(`  of those with password: ${totals.accountsWithPassword}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
