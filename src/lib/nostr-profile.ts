import { db } from "@/lib/db/client";
import { usersTable } from "@/lib/db/schema/user";
import { eq } from "drizzle-orm";
import { decode } from "nostr-tools/nip19";
import { SimplePool } from "nostr-tools/pool";

export const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.primal.net",
  "wss://nos.lol",
  "wss://relay.nostr.band",
];

export const MAX_RELAYS = 5;

const FETCH_TIMEOUT_MS = 8_000;

export type NostrProfileData = {
  about: string | null;
  displayName: string | null;
  picture: string | null;
};

export function npubToHex(npub: string): string {
  const result = decode(npub);

  if (result.type !== "npub") {
    throw new Error("Invalid npub");
  }

  return result.data;
}

export function isValidRelayUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "wss:" || parsed.protocol === "ws:";
  } catch {
    return false;
  }
}

function resolveDisplayName(content: Record<string, unknown>): string | null {
  if (typeof content.display_name === "string") {
    return content.display_name;
  }

  if (typeof content.name === "string") {
    return content.name;
  }

  return null;
}

export async function fetchNostrProfile(
  npub: string,
  relays: string[],
): Promise<NostrProfileData | null> {
  const hex = npubToHex(npub);
  const pool = new SimplePool();

  try {
    const events = await Promise.race([
      pool.querySync(relays, { authors: [hex], kinds: [0], limit: 1 }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), FETCH_TIMEOUT_MS),
      ),
    ]);

    if (events.length === 0) {
      return null;
    }

    const latest = events.reduce((a, b) => (a.created_at > b.created_at ? a : b));
    const content: Record<string, unknown> = JSON.parse(latest.content);

    return {
      about: typeof content.about === "string" ? content.about : null,
      displayName: resolveDisplayName(content),
      picture: typeof content.picture === "string" ? content.picture : null,
    };
  } catch {
    return null;
  } finally {
    pool.close(relays);
  }
}

export async function refreshNostrProfile(user: {
  id: string;
  nostrNpub: string | null;
  nostrRelays: string | null;
}): Promise<void> {
  if (user.nostrNpub == null) {
    return;
  }

  const relays: string[] = user.nostrRelays != null
    ? (JSON.parse(user.nostrRelays) as string[])
    : DEFAULT_RELAYS;

  const profile = await fetchNostrProfile(user.nostrNpub, relays);

  if (profile == null) {
    return;
  }

  await db
    .update(usersTable)
    .set({
      avatarUrl: profile.picture,
      bio: profile.about,
      customAvatar: profile.picture != null,
      displayName: profile.displayName,
      nostrProfileFetchedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, user.id));
}
