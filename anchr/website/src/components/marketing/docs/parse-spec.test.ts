import { describe, expect, it } from "vitest";
import { parseOpenApiSpec } from "./parse-spec";

const BASE_URL = "https://anchr.to";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper accepts loose shapes
function makeSpec(paths: Record<string, Record<string, any>>): Parameters<typeof parseOpenApiSpec>[0] {
  return { paths, servers: [{ url: BASE_URL }] };
}

describe("parseOpenApiSpec", () => {
  it("groups endpoints by tag in TAG_ORDER", () => {
    //* Arrange
    const spec = makeSpec({
      "/api/v1/groups": {
        get: { operationId: "listGroups", summary: "List groups", tags: ["Groups"] },
      },
      "/api/v1/links": {
        get: { operationId: "listLinks", summary: "List links", tags: ["Links"] },
      },
      "/api/v1/me": {
        get: { operationId: "getMe", summary: "Get profile", tags: ["Profile"] },
      },
    });

    //* Act
    const groups = parseOpenApiSpec(spec);

    //* Assert
    expect(groups.map((g) => g.tag)).toEqual(["Profile", "Links", "Groups"]);
  });

  it("orders methods within a path as get, post, patch, delete", () => {
    //* Arrange
    const spec = makeSpec({
      "/api/v1/links": {
        delete: { operationId: "deleteLink", summary: "Delete", tags: ["Links"] },
        get: { operationId: "listLinks", summary: "List", tags: ["Links"] },
        post: { operationId: "createLink", summary: "Create", tags: ["Links"] },
      },
    });

    //* Act
    const groups = parseOpenApiSpec(spec);
    const methods = groups[0].endpoints.map((e) => e.method);

    //* Assert
    expect(methods).toEqual(["get", "post", "delete"]);
  });

  it("skips endpoints tagged as OpenAPI", () => {
    //* Arrange
    const spec = makeSpec({
      "/api/v1/me": {
        get: { operationId: "getMe", summary: "Get profile", tags: ["Profile"] },
      },
      "/api/v1/openapi.json": {
        get: { operationId: "getOpenApi", summary: "OpenAPI spec", tags: ["OpenAPI"] },
      },
    });

    //* Act
    const groups = parseOpenApiSpec(spec);
    const allOps = groups.flatMap((g) => g.endpoints.map((e) => e.operationId));

    //* Assert
    expect(allOps).not.toContain("getOpenApi");
  });

  it("parses path parameters from operation and path pattern", () => {
    //* Arrange
    const spec = makeSpec({
      "/api/v1/users/{username}": {
        get: {
          operationId: "getUser",
          parameters: [{ in: "path", name: "username", required: true, schema: { type: "string" } }],
          summary: "Get user",
          tags: ["Profile"],
        },
      },
    });

    //* Act
    const groups = parseOpenApiSpec(spec);
    const endpoint = groups[0].endpoints[0];

    //* Assert
    expect(endpoint.params).toEqual([{ in: "path", name: "username", required: true, type: "string" }]);
  });

  it("infers path params from path pattern when not declared in parameters", () => {
    //* Arrange
    const spec = makeSpec({
      "/api/v1/links/{id}": {
        get: { operationId: "getLink", summary: "Get link", tags: ["Links"] },
      },
    });

    //* Act
    const groups = parseOpenApiSpec(spec);
    const endpoint = groups[0].endpoints[0];

    //* Assert
    expect(endpoint.params).toEqual([{ in: "path", name: "id", required: true, type: "string" }]);
  });

  it("detects requiresAuth from security field", () => {
    //* Arrange
    const spec = makeSpec({
      "/api/v1/me": {
        get: {
          operationId: "getMe",
          security: [{ BearerAuth: [] }],
          summary: "Get profile",
          tags: ["Profile"],
        },
      },
      "/api/v1/users/{username}": {
        get: { operationId: "getUser", summary: "Get user", tags: ["Profile"] },
      },
    });

    //* Act
    const groups = parseOpenApiSpec(spec);
    const endpoints = groups[0].endpoints;

    //* Assert
    expect(endpoints.find((e) => e.operationId === "getMe")?.requiresAuth).toBe(true);
    expect(endpoints.find((e) => e.operationId === "getUser")?.requiresAuth).toBe(false);
  });

  it("parses request body properties and required fields", () => {
    //* Arrange
    const spec = makeSpec({
      "/api/v1/links": {
        post: {
          operationId: "createLink",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  properties: {
                    title: { description: "Link title", type: "string" },
                    url: { description: "Link URL", type: "string" },
                  },
                  required: ["url"],
                },
              },
            },
          },
          summary: "Create link",
          tags: ["Links"],
        },
      },
    });

    //* Act
    const groups = parseOpenApiSpec(spec);
    const endpoint = groups[0].endpoints[0];

    //* Assert
    expect(endpoint.body).toEqual({
      properties: {
        title: { description: "Link title", nullable: false, type: "string" },
        url: { description: "Link URL", nullable: false, type: "string" },
      },
      required: ["url"],
    });
  });

  it("generates code examples for all three languages", () => {
    //* Arrange
    const spec = makeSpec({
      "/api/v1/users/{username}": {
        get: {
          operationId: "getUser",
          parameters: [{ in: "path", name: "username", required: true, schema: { type: "string" } }],
          summary: "Get user",
          tags: ["Profile"],
        },
      },
    });

    //* Act
    const groups = parseOpenApiSpec(spec);
    const examples = groups[0].endpoints[0].codeExamples;

    //* Assert
    expect(examples.curl).toContain("curl");
    expect(examples.curl).toContain(`${BASE_URL}/api/v1/users/alice`);
    expect(examples.javascript).toContain("fetch");
    expect(examples.python).toContain("requests.get");
  });

  it("includes auth header in code examples for authenticated endpoints", () => {
    //* Arrange
    const spec = makeSpec({
      "/api/v1/me": {
        get: {
          operationId: "getMe",
          security: [{ BearerAuth: [] }],
          summary: "Get profile",
          tags: ["Profile"],
        },
      },
    });

    //* Act
    const groups = parseOpenApiSpec(spec);
    const examples = groups[0].endpoints[0].codeExamples;

    //* Assert
    expect(examples.curl).toContain("Authorization: Bearer anc_k_YOUR_KEY");
    expect(examples.javascript).toContain("Authorization");
    expect(examples.python).toContain("Authorization");
  });

  it("excludes tags not in TAG_ORDER", () => {
    //* Arrange
    const spec = makeSpec({
      "/api/v1/custom": {
        get: { operationId: "custom", summary: "Custom", tags: ["Custom"] },
      },
      "/api/v1/me": {
        get: { operationId: "getMe", summary: "Get profile", tags: ["Profile"] },
      },
    });

    //* Act
    const groups = parseOpenApiSpec(spec);

    //* Assert
    expect(groups).toHaveLength(1);
    expect(groups[0].tag).toBe("Profile");
  });

  it("returns empty array when spec has no matching tags", () => {
    //* Arrange
    const spec = makeSpec({
      "/api/v1/custom": {
        get: { operationId: "custom", summary: "Custom", tags: ["Custom"] },
      },
    });

    //* Act
    const groups = parseOpenApiSpec(spec);

    //* Assert
    expect(groups).toEqual([]);
  });
});
