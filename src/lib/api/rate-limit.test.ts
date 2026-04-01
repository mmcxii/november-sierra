import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/env", () => {
  return {
    envSchema: {
      DATABASE_URL: "postgresql://localhost:5432/test",
      UPSTASH_REDIS_REST_TOKEN: "test-token",
      UPSTASH_REDIS_REST_URL: "https://test.upstash.io",
    },
  };
});
const mockLimit = vi.fn();
vi.mock("@upstash/ratelimit", () => {
  return {
    Ratelimit: class {
      static slidingWindow() {
        return {};
      }
      limit = mockLimit;
    },
  };
});
vi.mock("@upstash/redis", () => {
  return {
    Redis: class {},
  };
});
vi.mock("@neondatabase/serverless", () => {
  return {
    neon: vi.fn(),
  };
});
import {
  buildRateLimitHeaders,
  buildRateLimitResponse,
  checkRateLimit,
  rateLimitRequest,
  resolveIdentifierFromRequest,
} from "./rate-limit";

describe("resolveIdentifierFromRequest", () => {
  it("returns raw key when Authorization header has anc_k_ prefix", () => {
    //* Act
    const request = new Request("https://anchr.to/api/v1/links", {
      headers: { Authorization: "Bearer anc_k_abc123xyz" },
    });
    const result = resolveIdentifierFromRequest(request);

    //* Assert
    expect(result.rawKey).toBe("anc_k_abc123xyz");
    expect(result.identifier).toBe("anc_k_abc123xyz");
  });

  it("returns IP from x-forwarded-for when no auth header", () => {
    //* Act
    const request = new Request("https://anchr.to/api/v1/links", {
      headers: { "x-forwarded-for": "203.0.113.42, 10.0.0.1" },
    });
    const result = resolveIdentifierFromRequest(request);

    //* Assert
    expect(result.rawKey).toBeNull();
    expect(result.identifier).toBe("ip:203.0.113.42");
  });

  it("falls back to x-real-ip then unknown", () => {
    //* Act
    const withRealIp = resolveIdentifierFromRequest(
      new Request("https://anchr.to/api/v1/links", {
        headers: { "x-real-ip": "198.51.100.7" },
      }),
    );
    const withNothing = resolveIdentifierFromRequest(new Request("https://anchr.to/api/v1/links"));

    //* Assert
    expect(withRealIp.identifier).toBe("ip:198.51.100.7");
    expect(withNothing.identifier).toBe("ip:unknown");
  });

  it("treats non-anc_k_ bearer tokens as unauthenticated", () => {
    //* Act
    const request = new Request("https://anchr.to/api/v1/links", {
      headers: { Authorization: "Bearer some_other_token" },
    });
    const result = resolveIdentifierFromRequest(request);

    //* Assert
    expect(result.rawKey).toBeNull();
  });
});

describe("buildRateLimitHeaders", () => {
  it("returns correct header values", () => {
    //* Act
    const headers = buildRateLimitHeaders(100, 95, 45);

    //* Assert
    expect(headers).toEqual({
      "X-RateLimit-Limit": "100",
      "X-RateLimit-Remaining": "95",
      "X-RateLimit-Reset": "45",
    });
  });

  it("clamps negative remaining and reset to 0", () => {
    //* Act
    const headers = buildRateLimitHeaders(60, -1, -5);

    //* Assert
    expect(headers["X-RateLimit-Remaining"]).toBe("0");
    expect(headers["X-RateLimit-Reset"]).toBe("0");
  });
});

describe("buildRateLimitResponse", () => {
  it("returns 429 with error body, Retry-After, and CORS headers", async () => {
    //* Act
    const headers = buildRateLimitHeaders(60, 0, 42);
    const response = buildRateLimitResponse(headers, 42);

    //* Assert
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    expect(response.headers.get("X-RateLimit-Limit")).toBe("60");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");

    const body = await response.json();
    expect(body.error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(body.error.retryAfter).toBe(42);
  });
});

describe("checkRateLimit", () => {
  it("returns headers and limited=false when under limit", async () => {
    //* Arrange
    mockLimit.mockResolvedValue({ remaining: 59, reset: Date.now() + 30_000, success: true });

    //* Act
    const result = await checkRateLimit("ip:1.2.3.4", "unauthenticated");

    //* Assert
    expect(result.limited).toBe(false);
    expect(result.response).toBeNull();
    expect(result.headers["X-RateLimit-Limit"]).toBe("60");
    expect(Number(result.headers["X-RateLimit-Remaining"])).toBe(59);
  });

  it("returns 429 response when over limit", async () => {
    //* Arrange
    mockLimit.mockResolvedValue({ remaining: 0, reset: Date.now() + 15_000, success: false });

    //* Act
    const result = await checkRateLimit("ip:1.2.3.4", "unauthenticated");

    //* Assert
    expect(result.limited).toBe(true);
    expect(result.response).not.toBeNull();
    expect(result.response?.status).toBe(429);
  });
});

describe("rateLimitRequest", () => {
  it("fails open when Redis is unavailable", async () => {
    //* Arrange
    mockLimit.mockRejectedValue(new Error("Redis connection refused"));

    //* Act
    const result = await rateLimitRequest(new Request("https://anchr.to/api/v1/links"));

    //* Assert
    expect(result.limited).toBe(false);
    expect(result.response).toBeNull();
    expect(result.headers).toEqual({});
  });
});
