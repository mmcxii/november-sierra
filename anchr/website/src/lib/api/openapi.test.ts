import { describe, expect, it } from "vitest";
import { generateOpenApiSpec } from "./openapi";

describe("generateOpenApiSpec", () => {
  const spec = generateOpenApiSpec("https://anchr.to");

  it("returns valid OpenAPI 3.1.0 document", () => {
    //* Act
    const { info, openapi } = spec;

    //* Assert
    expect(openapi).toBe("3.1.0");
    expect(info.title).toBe("Anchr API");
    expect(info.version).toBe("1.0.0");
  });

  it("includes server URL", () => {
    //* Act
    const { servers } = spec;

    //* Assert
    expect(servers).toEqual([{ url: "https://anchr.to" }]);
  });

  it("registers BearerAuth security scheme", () => {
    //* Act
    const schemes = spec.components?.securitySchemes;

    //* Assert
    expect(schemes).toBeDefined();
    expect((schemes as Record<string, unknown>).BearerAuth).toEqual({
      bearerFormat: "API Key",
      scheme: "bearer",
      type: "http",
    });
  });

  it("contains all expected paths", () => {
    //* Act
    const paths = Object.keys(spec.paths ?? {});

    //* Assert
    expect(paths).toContain("/api/v1/me");
    expect(paths).toContain("/api/v1/users/{username}");
    expect(paths).toContain("/api/v1/links");
    expect(paths).toContain("/api/v1/links/{id}");
    expect(paths).toContain("/api/v1/links/reorder");
    expect(paths).toContain("/api/v1/links/{id}/visibility");
    expect(paths).toContain("/api/v1/links/{id}/featured");
    expect(paths).toContain("/api/v1/links/bulk/delete");
    expect(paths).toContain("/api/v1/links/bulk/visibility");
    expect(paths).toContain("/api/v1/groups");
    expect(paths).toContain("/api/v1/groups/{id}");
    expect(paths).toContain("/api/v1/groups/reorder");
    expect(paths).toContain("/api/v1/groups/{id}/visibility");
    expect(paths).toContain("/api/v1/analytics");
    expect(paths).toContain("/api/v1/analytics/links");
    expect(paths).toContain("/api/v1/analytics/referrers");
    expect(paths).toContain("/api/v1/analytics/devices");
    expect(paths).toContain("/api/v1/analytics/history");
    expect(paths).toContain("/api/v1/openapi.json");
  });

  it("public profile endpoint has no security requirement", () => {
    //* Act
    const profileGet = spec.paths?.["/api/v1/users/{username}"]?.get;

    //* Assert
    expect(profileGet?.security).toBeUndefined();
  });

  it("authenticated endpoints have security requirement", () => {
    //* Act
    const meGet = spec.paths?.["/api/v1/me"]?.get;

    //* Assert
    expect(meGet?.security).toEqual([{ BearerAuth: [] }]);
  });

  it("uses correct tags", () => {
    //* Act
    const meGet = spec.paths?.["/api/v1/me"]?.get;
    const linksGet = spec.paths?.["/api/v1/links"]?.get;
    const groupsGet = spec.paths?.["/api/v1/groups"]?.get;
    const analyticsGet = spec.paths?.["/api/v1/analytics"]?.get;

    //* Assert
    expect(meGet?.tags).toContain("Profile");
    expect(linksGet?.tags).toContain("Links");
    expect(groupsGet?.tags).toContain("Groups");
    expect(analyticsGet?.tags).toContain("Analytics");
  });
});
