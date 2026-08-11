import { describe, expect, it } from "vitest";
import { pickHomeTeam } from "./home-team";

describe("pickHomeTeam", () => {
  it("returns null for an empty list", () => {
    //* Arrange
    const memberships: { team: { endDate: string; id: string; startDate: string } }[] = [];

    //* Act
    const picked = pickHomeTeam(memberships);

    //* Assert
    expect(picked).toBeNull();
  });

  it("picks the earliest start date", () => {
    //* Arrange
    const memberships = [
      { team: { endDate: "2026-12-01", id: "b", startDate: "2026-09-15" } },
      { team: { endDate: "2026-11-01", id: "a", startDate: "2026-08-15" } },
      { team: { endDate: "2026-12-15", id: "c", startDate: "2026-10-01" } },
    ];

    //* Act
    const picked = pickHomeTeam(memberships);

    //* Assert
    expect(picked?.team.id).toBe("a");
  });

  it("breaks start-date ties with earlier end date then id", () => {
    //* Arrange
    const memberships = [
      { team: { endDate: "2026-11-10", id: "z", startDate: "2026-08-15" } },
      { team: { endDate: "2026-11-01", id: "m", startDate: "2026-08-15" } },
      { team: { endDate: "2026-11-01", id: "a", startDate: "2026-08-15" } },
    ];

    //* Act
    const picked = pickHomeTeam(memberships);

    //* Assert
    expect(picked?.team.id).toBe("a");
  });
});
