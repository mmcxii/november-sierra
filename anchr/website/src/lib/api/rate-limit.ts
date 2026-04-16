import { hashApiKeyEdge } from "@/lib/api-keys.edge";
import { envSchema } from "@/lib/env";
import type { Tier } from "@/lib/tier";
import { isProUser } from "@/lib/tier";
import { neon } from "@neondatabase/serverless";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { CORS_HEADERS } from "./response";

// ─── Rate Limiters ──────────────────────────────────────────────────────────

function createRedis(): Redis {
  return new Redis({
    token: envSchema.UPSTASH_REDIS_REST_TOKEN,
    url: envSchema.UPSTASH_REDIS_REST_URL,
  });
}

const RATE_LIMITS = {
  free: { limit: 100, window: "1 m" },
  pro: { limit: 1000, window: "1 m" },
  unauthenticated: { limit: 60, window: "1 m" },
} as const;

const limiters = new Map<string, Ratelimit>();

function getLimiter(tier: "free" | "pro" | "unauthenticated"): Ratelimit {
  let limiter = limiters.get(tier);
  if (limiter == null) {
    const { limit, window } = RATE_LIMITS[tier];
    limiter = new Ratelimit({
      limiter: Ratelimit.slidingWindow(limit, window),
      redis: createRedis(),
    });
    limiters.set(tier, limiter);
  }
  return limiter;
}

// ─── Tier Resolution ────────────────────────────────────────────────────────

/**
 * Resolve the rate limit identifier from a request.
 *
 * - If an `Authorization: Bearer anc_k_...` header is present, returns the raw key.
 * - Otherwise, falls back to IP address as the identifier.
 */
export function resolveIdentifierFromRequest(request: Request): {
  identifier: string;
  rawKey: null | string;
} {
  const authHeader = request.headers.get("authorization");

  if (authHeader != null && authHeader.startsWith("Bearer ")) {
    const rawKey = authHeader.slice("Bearer ".length);

    if (rawKey.startsWith("anc_k_")) {
      return { identifier: rawKey, rawKey };
    }
  }

  // Fall back to IP address
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";

  return { identifier: `ip:${ip}`, rawKey: null };
}

// ─── Rate Limit Check ───────────────────────────────────────────────────────

export type RateLimitResult = {
  headers: Record<string, string>;
  limited: boolean;
  response: null | Response;
};

/**
 * Check rate limit for a request and return headers + optional 429 response.
 */
export async function checkRateLimit(
  identifier: string,
  tier: "free" | "pro" | "unauthenticated",
): Promise<RateLimitResult> {
  const limiter = getLimiter(tier);
  const { remaining, reset, success } = await limiter.limit(identifier);

  const resetSeconds = Math.ceil((reset - Date.now()) / 1000);
  const headers = buildRateLimitHeaders(RATE_LIMITS[tier].limit, remaining, resetSeconds);

  if (!success) {
    return {
      headers,
      limited: true,
      response: buildRateLimitResponse(headers, resetSeconds),
    };
  }

  return { headers, limited: false, response: null };
}

// ─── Headers & Response Builders ────────────────────────────────────────────

export function buildRateLimitHeaders(limit: number, remaining: number, resetSeconds: number): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(Math.max(0, remaining)),
    "X-RateLimit-Reset": String(Math.max(0, resetSeconds)),
  };
}

export function buildRateLimitResponse(headers: Record<string, string>, retryAfter: number): Response {
  return Response.json(
    {
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Rate limit exceeded. Please retry later.",
        retryAfter,
      },
    },
    {
      headers: {
        ...headers,
        ...CORS_HEADERS,
        "Retry-After": String(retryAfter),
      },
      status: 429,
    },
  );
}

/**
 * Resolve the tier for an API key hash by querying the database.
 * Uses raw neon() SQL for Edge Runtime compatibility.
 */
export async function resolveTierFromKeyHash(keyHash: string): Promise<null | Tier> {
  const sql = neon(envSchema.DATABASE_URL);

  const rows = await sql`
    SELECT u.tier, u.pro_expires_at
    FROM api_keys ak
    INNER JOIN users u ON ak.user_id = u.id
    WHERE ak.key_hash = ${keyHash}
      AND ak.revoked_at IS NULL
    LIMIT 1
  `;

  const row = rows[0];
  if (row == null) {
    return null;
  }

  const proExpiresAt = row.pro_expires_at != null ? new Date(row.pro_expires_at as string) : null;

  return isProUser({ proExpiresAt, tier: row.tier as string }) ? "pro" : "free";
}

/**
 * Full rate limit flow for a request:
 * 1. Extract identifier (API key hash or IP)
 * 2. Resolve tier
 * 3. Check rate limit
 */
export async function rateLimitRequest(request: Request): Promise<RateLimitResult> {
  try {
    const { identifier, rawKey } = resolveIdentifierFromRequest(request);

    let tier: "free" | "pro" | "unauthenticated" = "unauthenticated";
    let rateLimitKey = identifier;

    if (rawKey != null) {
      const keyHash = await hashApiKeyEdge(rawKey);
      const resolvedTier = await resolveTierFromKeyHash(keyHash);

      if (resolvedTier != null) {
        tier = resolvedTier;
        rateLimitKey = `key:${keyHash}`;
      }
      // If key is invalid, fall through to unauthenticated (route handler will return 401)
    }

    return await checkRateLimit(rateLimitKey, tier);
  } catch (error) {
    console.error("[rate-limit] Redis or tier resolution failed, allowing request:", error);
    return { headers: {}, limited: false, response: null };
  }
}

// ─── Short URL Redirect Rate Limiter ────────────────────────────────────────

/** Per-IP sliding-window limit for short URL redirects (/r/[slug]). Picked to
 *  be ~50× typical legitimate click-through (one user clicking a few links) so
 *  normal traffic is untouched, while sustained scraping/enumeration across the
 *  ~33M 5-char slug space gets throttled. */
const SHORT_URL_RATE_LIMIT = { limit: 120, window: "1 m" } as const;
let shortUrlLimiter: null | Ratelimit = null;

function getShortUrlLimiter(): Ratelimit {
  if (shortUrlLimiter == null) {
    shortUrlLimiter = new Ratelimit({
      limiter: Ratelimit.slidingWindow(SHORT_URL_RATE_LIMIT.limit, SHORT_URL_RATE_LIMIT.window),
      redis: createRedis(),
    });
  }
  return shortUrlLimiter;
}

/** Check the short-URL-redirect rate limit for a request. Keyed on the client
 *  IP (x-forwarded-for / fallback). Returns `limited=true` + a 429 response
 *  when exceeded. Fails open (allows the request) on Redis errors so a single
 *  Upstash outage doesn't break all short URL redirects. */
export async function rateLimitShortUrlRedirect(
  request: Request,
): Promise<{ limited: boolean; response: null | Response }> {
  try {
    const { identifier } = resolveIdentifierFromRequest(request);
    const key = `short-url:${identifier}`;
    const { success } = await getShortUrlLimiter().limit(key);
    if (!success) {
      return { limited: true, response: new Response("Too Many Requests", { status: 429 }) };
    }
    return { limited: false, response: null };
  } catch (error) {
    console.error("[rate-limit] short URL limiter failed, allowing request:", error);
    return { limited: false, response: null };
  }
}
