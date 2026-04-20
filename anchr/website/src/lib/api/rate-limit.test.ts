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
  bucketForAuthPath,
  buildRateLimitHeaders,
  buildRateLimitResponse,
  checkRateLimit,
  checkRecoveryCodePerUserRateLimit,
  rateLimitAuthRequest,
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

describe("bucketForAuthPath", () => {
  it("routes sign-in and sign-up paths to the sign-in bucket", () => {
    //* Arrange
    const paths = ["/api/v1/auth/sign-in/email", "/api/v1/auth/sign-up/email", "/api/v1/auth/sign-in/social"];

    //* Act
    const buckets = paths.map((p) => bucketForAuthPath(p));

    //* Assert
    expect(buckets).toEqual(["sign-in", "sign-in", "sign-in"]);
  });

  it("routes all password-reset variants to the password-reset bucket", () => {
    //* Arrange
    const paths = [
      "/api/v1/auth/request-password-reset",
      "/api/v1/auth/reset-password/some-token",
      "/api/v1/auth/forget-password",
    ];

    //* Act
    const buckets = paths.map((p) => bucketForAuthPath(p));

    //* Assert
    expect(buckets).toEqual(["password-reset", "password-reset", "password-reset"]);
  });

  it("routes two-factor sub-paths to the two-factor bucket", () => {
    //* Arrange
    const paths = [
      "/api/v1/auth/two-factor/enable",
      "/api/v1/auth/two-factor/send-otp",
      "/api/v1/auth/two-factor/verify-otp",
    ];

    //* Act
    const buckets = paths.map((p) => bucketForAuthPath(p));

    //* Assert
    expect(buckets).toEqual(["two-factor", "two-factor", "two-factor"]);
  });

  it("routes email-OTP paths to the email-otp bucket", () => {
    //* Arrange
    const paths = ["/api/v1/auth/email-otp/send-verification-otp", "/api/v1/auth/send-verification-email"];

    //* Act
    const buckets = paths.map((p) => bucketForAuthPath(p));

    //* Assert
    expect(buckets).toEqual(["email-otp", "email-otp"]);
  });

  it("routes recovery-code paths to the recovery-codes bucket", () => {
    //* Arrange
    const paths = ["/api/v1/auth/recovery-codes/redeem", "/api/v1/auth/recovery-codes/generate"];

    //* Act
    const buckets = paths.map((p) => bucketForAuthPath(p));

    //* Assert
    expect(buckets).toEqual(["recovery-codes", "recovery-codes"]);
  });

  it("falls back to auth-default for un-bucketed /api/v1/auth paths", () => {
    //* Arrange
    const paths = ["/api/v1/auth/session", "/api/v1/auth/sign-out", "/api/v1/auth/unknown-endpoint"];

    //* Act
    const buckets = paths.map((p) => bucketForAuthPath(p));

    //* Assert
    expect(buckets).toEqual(["auth-default", "auth-default", "auth-default"]);
  });

  it("is trailing-slash agnostic", () => {
    //* Arrange
    const withSlash = "/api/v1/auth/sign-in/email/";
    const withoutSlash = "/api/v1/auth/sign-in/email";

    //* Act
    const a = bucketForAuthPath(withSlash);
    const b = bucketForAuthPath(withoutSlash);

    //* Assert
    expect(a).toBe("sign-in");
    expect(b).toBe("sign-in");
  });
});

describe("rateLimitAuthRequest", () => {
  it("returns 429 when the bucket is exhausted", async () => {
    //* Arrange
    mockLimit.mockResolvedValue({ remaining: 0, reset: Date.now() + 5_000, success: false });

    //* Act
    const result = await rateLimitAuthRequest(
      new Request("https://anchr.to/api/v1/auth/sign-in/email", {
        headers: { "x-forwarded-for": "203.0.113.42" },
        method: "POST",
      }),
    );

    //* Assert
    expect(result.limited).toBe(true);
    expect(result.response?.status).toBe(429);
    expect(result.headers["X-RateLimit-Limit"]).toBe("30");
  });

  it("returns limited=false when the bucket has capacity", async () => {
    //* Arrange
    mockLimit.mockResolvedValue({ remaining: 29, reset: Date.now() + 60_000, success: true });

    //* Act
    const result = await rateLimitAuthRequest(
      new Request("https://anchr.to/api/v1/auth/sign-in/email", {
        headers: { "x-forwarded-for": "203.0.113.42" },
        method: "POST",
      }),
    );

    //* Assert
    expect(result.limited).toBe(false);
    expect(result.response).toBeNull();
  });

  it("fails open when Redis is unavailable", async () => {
    //* Arrange
    mockLimit.mockRejectedValue(new Error("Redis connection refused"));

    //* Act
    const result = await rateLimitAuthRequest(new Request("https://anchr.to/api/v1/auth/sign-in/email"));

    //* Assert
    expect(result.limited).toBe(false);
    expect(result.response).toBeNull();
  });

  it("uses the recovery-codes bucket size when called against a recovery path", async () => {
    //* Arrange
    mockLimit.mockResolvedValue({ remaining: 0, reset: Date.now() + 5_000, success: false });

    //* Act
    const result = await rateLimitAuthRequest(
      new Request("https://anchr.to/api/v1/auth/recovery-codes/redeem", {
        headers: { "x-forwarded-for": "203.0.113.42" },
        method: "POST",
      }),
    );

    //* Assert
    expect(result.headers["X-RateLimit-Limit"]).toBe("20");
  });
});

describe("checkRecoveryCodePerUserRateLimit", () => {
  it("returns limited=true after the per-user bucket fills", async () => {
    //* Arrange
    mockLimit.mockResolvedValue({ remaining: 0, reset: Date.now() + 30_000, success: false });

    //* Act
    const result = await checkRecoveryCodePerUserRateLimit("user_abc");

    //* Assert
    expect(result.limited).toBe(true);
    expect(result.response?.status).toBe(429);
  });

  it("returns limited=false when the per-user bucket has capacity", async () => {
    //* Arrange
    mockLimit.mockResolvedValue({ remaining: 4, reset: Date.now() + 30_000, success: true });

    //* Act
    const result = await checkRecoveryCodePerUserRateLimit("user_abc");

    //* Assert
    expect(result.limited).toBe(false);
    expect(result.response).toBeNull();
  });
});
