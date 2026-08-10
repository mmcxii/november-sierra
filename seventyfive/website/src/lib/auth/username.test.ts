import { describe, expect, it } from "vitest";
import { usernameBaseFromDisplayName } from "./username";

describe("usernameBaseFromDisplayName", () => {
  it("lowercases and strips non-alphanumerics", () => {
    //* Arrange
    const displayName = "Nich O'Brien";

    //* Act
    const username = usernameBaseFromDisplayName(displayName);

    //* Assert
    expect(username).toBe("nichobrien");
  });

  it("pads short names", () => {
    //* Arrange
    const displayName = "Jo";

    //* Act
    const username = usernameBaseFromDisplayName(displayName);

    //* Assert
    expect(username.length).toBeGreaterThanOrEqual(3);
  });
});
