/**
 * Scans .next/static/chunks for any server-only env var value.
 *
 * Run after `pnpm build` (see scripts/validate-build.sh). Fails if any value
 * whose key is in envSchema's `server` declaration appears in any client
 * chunk. Server-only values must never be inlined into the client bundle —
 * see ANC-191 for the incident this check guards against.
 *
 * The allowed-to-leak set is exactly envSchema's `client` keys (the
 * NEXT_PUBLIC_* variables). Everything else is server-only.
 */
import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { SERVER_ENV_KEYS } from "../src/lib/env.ts";

const CHUNKS_DIR = join(import.meta.dirname, "..", ".next", "static", "chunks");

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? walk(path) : [path];
    }),
  );
  return nested.flat();
}

async function main(): Promise<void> {
  try {
    await stat(CHUNKS_DIR);
  } catch {
    console.error(`✘ No client chunks found at ${CHUNKS_DIR}. Did the build run?`);
    process.exit(1);
  }

  const allFiles = await walk(CHUNKS_DIR);
  const jsChunks = allFiles.filter((file) => file.endsWith(".js"));

  if (jsChunks.length === 0) {
    console.error(`✘ No .js files found under ${CHUNKS_DIR}`);
    process.exit(1);
  }

  const leaks: { chunk: string; key: string; preview: string }[] = [];

  for (const key of SERVER_ENV_KEYS) {
    const value = process.env[key];
    if (value == null || value === "") {
      continue;
    }

    for (const chunkPath of jsChunks) {
      const content = await readFile(chunkPath, "utf8");
      const idx = content.indexOf(value);
      if (idx !== -1) {
        const start = Math.max(0, idx - 40);
        const end = Math.min(content.length, idx + value.length + 40);
        leaks.push({
          chunk: chunkPath.replace(`${process.cwd()}/`, ""),
          key,
          preview: content.slice(start, end).replace(/\s+/g, " "),
        });
      }
    }
  }

  if (leaks.length > 0) {
    console.error("\n✘ Server-only env values leaked into client chunks:\n");
    for (const leak of leaks) {
      console.error(`  ${leak.key}`);
      console.error(`    file:    ${leak.chunk}`);
      console.error(`    context: …${leak.preview}…\n`);
    }
    console.error("envSchema.server keys must never appear in .next/static/chunks.");
    console.error("Check next.config.ts `env` config and any webpack DefinePlugin overrides.\n");
    process.exit(1);
  }

  console.log(`✔ Scanned ${jsChunks.length} client chunk(s); no server-only env values found.`);
}

await main();
