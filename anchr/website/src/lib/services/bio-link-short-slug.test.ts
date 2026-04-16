import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockExecute = vi.fn();

vi.mock("@/lib/db/client", () => ({
  db: {
    execute: (...args: unknown[]) => mockExecute(...args),
  },
}));

const mockGenerate = vi.fn<() => Promise<string>>();
vi.mock("@/lib/utils/short-slug", () => ({
  generateUniqueShortSlug: () => mockGenerate(),
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("assignBioLinkShortSlug", () => {
  beforeEach(() => {
    mockExecute.mockReset();
    mockGenerate.mockReset();
  });

  it("executes the combined INSERT + UPDATE CTE and returns the generated slug", async () => {
    //* Arrange
    mockGenerate.mockResolvedValueOnce("abc23");
    mockExecute.mockResolvedValueOnce(undefined);
    const { assignBioLinkShortSlug } = await import("./bio-link-short-slug");

    //* Act
    const result = await assignBioLinkShortSlug({ linkId: "link-1", userId: "user-1" });

    //* Assert — one round-trip via db.execute(), slug returned verbatim.
    expect(result).toBe("abc23");
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it("propagates a DB error back to the caller (no swallow)", async () => {
    //* Arrange
    mockGenerate.mockResolvedValueOnce("abc23");
    mockExecute.mockRejectedValueOnce(new Error("unique_violation"));
    const { assignBioLinkShortSlug } = await import("./bio-link-short-slug");

    //* Act
    const promise = assignBioLinkShortSlug({ linkId: "link-1", userId: "user-1" });

    //* Assert
    await expect(promise).rejects.toThrow("unique_violation");
  });
});
