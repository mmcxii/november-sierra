import { describe, expect, it } from "vitest";
import { generateOpenApiSpec } from "./openapi";

describe("generateOpenApiSpec", () => {
  const spec = generateOpenApiSpec("https://seventyfive.team");

  it("returns valid OpenAPI 3.1.0 document", () => {
    //* Act
    const { info, openapi } = spec;

    //* Assert
    expect(openapi).toBe("3.1.0");
    expect(info.title).toBe("SeventyFive API");
    expect(info.version).toBe("1.0.0");
  });

  it("includes server URL", () => {
    //* Act
    const { servers } = spec;

    //* Assert
    expect(servers).toEqual([{ url: "https://seventyfive.team" }]);
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

  it("contains REST paths and not MCP", () => {
    //* Act
    const paths = Object.keys(spec.paths ?? {});

    //* Assert
    expect(paths).toContain("/api/v1/teams");
    expect(paths).toContain("/api/v1/teams/{teamId}/board");
    expect(paths).toContain("/api/v1/teams/{teamId}/tasks/{taskId}");
    expect(paths).toContain("/api/v1/openapi.json");
    expect(paths).not.toContain("/api/v1/mcp");
  });

  it("requires Bearer auth on team endpoints", () => {
    //* Act
    const listTeams = spec.paths?.["/api/v1/teams"]?.get;
    const openApi = spec.paths?.["/api/v1/openapi.json"]?.get;

    //* Assert
    expect(listTeams?.security).toEqual([{ BearerAuth: [] }]);
    expect(openApi?.security).toBeUndefined();
  });
});
