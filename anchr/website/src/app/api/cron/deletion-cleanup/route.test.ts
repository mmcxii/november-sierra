import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/env", () => ({
  envSchema: {
    CRON_SECRET: "test-cron-secret",
  },
}));
const mockRetryDeletionCleanup = vi.fn();
vi.mock("@/lib/services/account-deletion-cleanup", () => ({
  retryDeletionCleanup: (...args: unknown[]) => mockRetryDeletionCleanup(...args),
}));
import { GET } from "./route";

describe("deletion-cleanup cron", () => {
  it("rejects requests without authorization", async () => {
    //* Arrange
    const req = new Request("http://localhost/api/cron/deletion-cleanup");

    //* Act
    const res = await GET(req);

    //* Assert
    expect(res.status).toBe(401);
  });

  it("rejects requests with wrong secret", async () => {
    //* Arrange
    const req = new Request("http://localhost/api/cron/deletion-cleanup", {
      headers: { Authorization: "Bearer wrong-secret" },
    });

    //* Act
    const res = await GET(req);

    //* Assert
    expect(res.status).toBe(401);
  });

  it("returns cleanup results on success", async () => {
    //* Arrange
    mockRetryDeletionCleanup.mockResolvedValue({
      alerted: 0,
      failed: 0,
      resolved: 2,
      retried: 2,
    });
    const req = new Request("http://localhost/api/cron/deletion-cleanup", {
      headers: { Authorization: "Bearer test-cron-secret" },
    });

    //* Act
    const res = await GET(req);
    const body = await res.json();

    //* Assert
    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.resolved).toBe(2);
    expect(body.retried).toBe(2);
  });

  it("returns 500 when cleanup throws", async () => {
    //* Arrange
    mockRetryDeletionCleanup.mockRejectedValue(new Error("db connection failed"));
    const req = new Request("http://localhost/api/cron/deletion-cleanup", {
      headers: { Authorization: "Bearer test-cron-secret" },
    });

    //* Act
    const res = await GET(req);
    const body = await res.json();

    //* Assert
    expect(res.status).toBe(500);
    expect(body.status).toBe("error");
    expect(body.error).toContain("db connection failed");
  });
});
