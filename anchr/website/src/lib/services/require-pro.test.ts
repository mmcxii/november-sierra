import type { ApiKeyUser } from "@/lib/api/auth";
import { describe, expect, it } from "vitest";
import { requirePro } from "./require-pro";

const PRO_USER: ApiKeyUser = { id: "user-1", tier: "pro", username: "prouser" };
const FREE_USER: ApiKeyUser = { id: "user-2", tier: "free", username: "freeuser" };

describe("requirePro", () => {
  it("returns null for Pro users", () => {
    //* Act
    const result = requirePro(PRO_USER);

    //* Assert
    expect(result).toBeNull();
  });

  it("returns PRO_REQUIRED error for free users", () => {
    //* Act
    const result = requirePro(FREE_USER);

    //* Assert
    expect(result).not.toBeNull();
    expect(result?.error?.code).toBe("PRO_REQUIRED");
    expect(result?.error?.status).toBe(403);
  });
});
