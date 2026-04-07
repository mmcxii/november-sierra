import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/env", () => {
  return {
    envSchema: {
      CRON_SECRET: "test-cron-secret",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      UPSTASH_REDIS_REST_TOKEN: "test-token",
      UPSTASH_REDIS_REST_URL: "https://test.upstash.io",
    },
  };
});
const mockSet = vi.fn();
const mockGet = vi.fn();
vi.mock("@upstash/redis", () => {
  return {
    Redis: class {
      set = mockSet;
      get = mockGet;
    },
  };
});
import { GET } from "./route";

describe("redis health cron", () => {
  it("rejects requests without authorization", async () => {
    //* Arrange
    const req = new Request("http://localhost/api/cron/redis-health");

    //* Act
    const res = await GET(req);

    //* Assert
    expect(res.status).toBe(401);
  });

  it("rejects requests with wrong secret", async () => {
    //* Arrange
    const req = new Request("http://localhost/api/cron/redis-health", {
      headers: { Authorization: "Bearer wrong-secret" },
    });

    //* Act
    const res = await GET(req);

    //* Assert
    expect(res.status).toBe(401);
  });

  it("returns 200 when redis roundtrip succeeds", async () => {
    //* Arrange
    mockSet.mockResolvedValue("OK");
    mockGet.mockImplementation(() => {
      const setCall = mockSet.mock.calls.at(-1);
      return Promise.resolve(setCall?.[1]);
    });
    const req = new Request("http://localhost/api/cron/redis-health", {
      headers: { Authorization: "Bearer test-cron-secret" },
    });

    //* Act
    const res = await GET(req);
    const body = await res.json();

    //* Assert
    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.latencyMs).toBeTypeOf("number");
  });

  it("returns 200 when redis returns a numeric value instead of string", async () => {
    //* Arrange
    mockSet.mockResolvedValue("OK");
    mockGet.mockImplementation(() => {
      const setCall = mockSet.mock.calls.at(-1);
      return Promise.resolve(Number(setCall?.[1]));
    });
    const req = new Request("http://localhost/api/cron/redis-health", {
      headers: { Authorization: "Bearer test-cron-secret" },
    });

    //* Act
    const res = await GET(req);
    const body = await res.json();

    //* Assert
    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
  });

  it("returns 503 when redis read does not match write", async () => {
    //* Arrange
    mockSet.mockResolvedValue("OK");
    mockGet.mockResolvedValue("stale-value");
    const req = new Request("http://localhost/api/cron/redis-health", {
      headers: { Authorization: "Bearer test-cron-secret" },
    });

    //* Act
    const res = await GET(req);
    const body = await res.json();

    //* Assert
    expect(res.status).toBe(503);
    expect(body.status).toBe("error");
  });

  it("returns 503 when redis throws an error", async () => {
    //* Arrange
    mockSet.mockRejectedValue(new Error("connection refused"));
    const req = new Request("http://localhost/api/cron/redis-health", {
      headers: { Authorization: "Bearer test-cron-secret" },
    });

    //* Act
    const res = await GET(req);
    const body = await res.json();

    //* Assert
    expect(res.status).toBe(503);
    expect(body.status).toBe("error");
    expect(body.error).toContain("connection refused");
  });
});
