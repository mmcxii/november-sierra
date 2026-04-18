import type { ApiKeyUser } from "@/lib/api/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/db/client", () => ({
  db: {
    delete: (...args: unknown[]) => mockDelete(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

const mockGetCustomThemesByUserId = vi.fn();
const mockGetCustomThemeById = vi.fn();
vi.mock("@/lib/db/queries/custom-theme", () => ({
  getCustomThemeById: (...a: unknown[]) => mockGetCustomThemeById(...a),
  getCustomThemesByUserId: (...a: unknown[]) => mockGetCustomThemesByUserId(...a),
}));

vi.mock("@/lib/db/schema/custom-theme", () => ({
  customThemesTable: { id: "id", name: "name", userId: "user_id" },
}));

vi.mock("@/lib/db/schema/user", () => ({
  usersTable: {
    id: "id",
    pageDarkTheme: "page_dark_theme",
    pageLightTheme: "page_light_theme",
  },
}));

vi.mock("@/lib/css-sanitizer", () => ({
  sanitizeCss: (raw: string) => {
    if (raw.includes("FORBIDDEN")) {
      return { errors: ["Removed disallowed property"], sanitized: "" };
    }
    return { errors: [], sanitized: raw };
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { createCustomTheme, deleteCustomTheme, listThemes, updateCustomTheme } = await import("./custom-theme");

// ─── Fixtures ───────────────────────────────────────────────────────────────

const PRO_USER: ApiKeyUser = { id: "user-1", tier: "pro", username: "prouser" };
const FREE_USER: ApiKeyUser = { id: "user-2", tier: "free", username: "freeuser" };

const VARIABLES = {
  "anchor-color": "#fff",
  "avatar-bg": "#000",
  "avatar-inner-border": "#000",
  "avatar-outer-ring": "#000",
  border: "#000",
  brand: "#000",
  "card-bg": "#000",
  divider: "#000",
  "featured-bg": "#000",
  "featured-border": "#000",
  "featured-icon-bg": "#000",
  "featured-icon-color": "#000",
  "featured-text": "#000",
  "glow-bg": "#000",
  hairline: "#000",
  "link-bg": "#000",
  "link-border": "#000",
  "link-icon-bg": "#000",
  "link-icon-color": "#000",
  "link-text": "#000",
  "name-color": "#000",
} as const;

function mockInsertReturning(row: unknown) {
  mockInsert.mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([row]),
    }),
  });
}

function mockUpdateReturning(row: unknown) {
  mockUpdate.mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([row]),
      }),
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── listThemes ─────────────────────────────────────────────────────────────

describe("listThemes", () => {
  it("returns presets and custom themes for free users (not Pro-gated)", async () => {
    //* Arrange
    mockGetCustomThemesByUserId.mockResolvedValue([]);

    //* Act
    const result = await listThemes(FREE_USER);

    //* Assert
    expect(result.error).toBeNull();
    expect(result.data?.presets.length).toBeGreaterThan(0);
    expect(result.data?.custom).toEqual([]);
    expect(result.data?.presets.every((p) => p.type === "preset")).toBe(true);
  });
});

// ─── createCustomTheme ──────────────────────────────────────────────────────

describe("createCustomTheme", () => {
  it("rejects free users with PRO_REQUIRED", async () => {
    //* Act
    const result = await createCustomTheme(FREE_USER, { name: "Test", variables: VARIABLES });

    //* Assert
    expect(result.error?.code).toBe("PRO_REQUIRED");
  });

  it("rejects duplicate names with 409", async () => {
    //* Arrange
    mockGetCustomThemesByUserId.mockResolvedValue([{ id: "t-1", name: "Existing" }]);

    //* Act
    const result = await createCustomTheme(PRO_USER, { name: "Existing", variables: VARIABLES });

    //* Assert
    expect(result.error?.code).toBe("VALIDATION_ERROR");
    expect(result.error?.status).toBe(409);
  });

  it("rejects when theme limit is reached", async () => {
    //* Arrange
    mockGetCustomThemesByUserId.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({ id: `t-${i}`, name: `Theme ${i}` })),
    );

    //* Act
    const result = await createCustomTheme(PRO_USER, { name: "New", variables: VARIABLES });

    //* Assert
    expect(result.error?.code).toBe("VALIDATION_ERROR");
    expect(result.error?.message).toContain("limit");
  });

  it("surfaces warnings when the sanitizer strips CSS rules", async () => {
    //* Arrange
    mockGetCustomThemesByUserId.mockResolvedValue([]);
    const row = {
      backgroundImage: null,
      borderRadius: null,
      createdAt: new Date("2026-01-01"),
      font: null,
      id: "t-new",
      name: "New",
      overlayColor: null,
      overlayOpacity: null,
      rawCss: null,
      updatedAt: new Date("2026-01-01"),
      variables: VARIABLES,
    };
    mockInsertReturning(row);

    //* Act
    const result = await createCustomTheme(PRO_USER, {
      name: "New",
      rawCss: "FORBIDDEN { foo: bar; }",
      variables: VARIABLES,
    });

    //* Assert
    expect(result.error).toBeNull();
    expect(result.data?.warnings).toEqual(["Removed disallowed property"]);
  });
});

// ─── updateCustomTheme ──────────────────────────────────────────────────────

describe("updateCustomTheme", () => {
  it("merges partial variables with existing values", async () => {
    //* Arrange
    const existing = {
      backgroundImage: null,
      borderRadius: null,
      createdAt: new Date("2026-01-01"),
      font: null,
      id: "t-1",
      name: "Existing",
      overlayColor: null,
      overlayOpacity: null,
      rawCss: null,
      updatedAt: new Date("2026-01-01"),
      userId: PRO_USER.id,
      variables: { ...VARIABLES, brand: "#111" },
    };
    mockGetCustomThemeById.mockResolvedValue(existing);

    const updatedRow = { ...existing, updatedAt: new Date("2026-01-02"), variables: { ...VARIABLES, brand: "#222" } };
    mockUpdateReturning(updatedRow);

    //* Act
    const result = await updateCustomTheme(PRO_USER, "t-1", { variables: { brand: "#222" } });

    //* Assert — set was called with merged variables (all 21 keys, brand overridden)
    expect(result.error).toBeNull();
    const setCall = mockUpdate.mock.results[0]?.value.set.mock.calls[0]?.[0];
    expect(setCall.variables.brand).toBe("#222");
    expect(setCall.variables["anchor-color"]).toBe("#fff");
  });

  it("rejects duplicate names with 409", async () => {
    //* Arrange
    const existing = {
      createdAt: new Date("2026-01-01"),
      id: "t-1",
      name: "Current",
      updatedAt: new Date("2026-01-01"),
      userId: PRO_USER.id,
      variables: VARIABLES,
    };
    mockGetCustomThemeById.mockResolvedValue(existing);
    mockGetCustomThemesByUserId.mockResolvedValue([existing, { id: "t-2", name: "Taken" }]);

    //* Act
    const result = await updateCustomTheme(PRO_USER, "t-1", { name: "Taken" });

    //* Assert
    expect(result.error?.status).toBe(409);
  });
});

// ─── deleteCustomTheme ──────────────────────────────────────────────────────

describe("deleteCustomTheme", () => {
  it("is not Pro-gated so downgraded users can clean up", async () => {
    //* Arrange
    mockGetCustomThemeById.mockResolvedValue({ id: "t-1", userId: FREE_USER.id });
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ pageDarkTheme: "dark-depths", pageLightTheme: "stateroom" }]),
        }),
      }),
    });
    mockDelete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });

    //* Act
    const result = await deleteCustomTheme(FREE_USER, "t-1");

    //* Assert
    expect(result.error).toBeNull();
  });

  it("resets any bio-page slot pointing at the deleted theme", async () => {
    //* Arrange
    mockGetCustomThemeById.mockResolvedValue({ id: "t-1", userId: PRO_USER.id });
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ pageDarkTheme: "t-1", pageLightTheme: "stateroom" }]),
        }),
      }),
    });
    const updateSet = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    mockUpdate.mockReturnValue({ set: updateSet });
    mockDelete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });

    //* Act
    const result = await deleteCustomTheme(PRO_USER, "t-1");

    //* Assert — slot reset to preset default
    expect(result.error).toBeNull();
    expect(updateSet.mock.calls[0]?.[0].pageDarkTheme).toBe("dark-depths");
    expect(updateSet.mock.calls[0]?.[0].pageLightTheme).toBeUndefined();
  });
});
