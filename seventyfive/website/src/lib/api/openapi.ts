import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

export function generateOpenApiSpec(baseUrl: string) {
  const registry = new OpenAPIRegistry();

  registry.registerComponent("securitySchemes", "BearerAuth", {
    bearerFormat: "API Key",
    scheme: "bearer",
    type: "http",
  });

  const bearerAuth = [{ BearerAuth: [] }];

  registry.registerPath({
    method: "get",
    operationId: "listTeams",
    path: "/api/v1/teams",
    responses: {
      200: { description: "Teams the authenticated user belongs to" },
      401: { description: "Unauthorized" },
    },
    security: bearerAuth,
    summary: "List teams",
    tags: ["Teams"],
  });

  registry.registerPath({
    method: "get",
    operationId: "getBoard",
    path: "/api/v1/teams/{teamId}/board",
    request: {
      params: z.object({ teamId: z.string() }),
      query: z.object({
        date: z.string().optional().describe("Challenge calendar date YYYY-MM-DD. Defaults to local today."),
      }),
    },
    responses: {
      200: { description: "Board for the date: tasks, remaining work, progress, roster" },
      400: { description: "Validation error" },
      401: { description: "Unauthorized" },
      404: { description: "Not a member of that team" },
    },
    security: bearerAuth,
    summary: "Get a team board",
    tags: ["Teams"],
  });

  registry.registerPath({
    method: "patch",
    operationId: "setTask",
    path: "/api/v1/teams/{teamId}/tasks/{taskId}",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              checked: z.boolean().describe("True to check the task, false to uncheck."),
              date: z
                .string()
                .optional()
                .describe("Challenge calendar date YYYY-MM-DD. Defaults to the member's local today."),
            }),
          },
        },
      },
      params: z.object({
        taskId: z.string().describe("Task id from the board, e.g. water, workout, diet."),
        teamId: z.string(),
      }),
    },
    responses: {
      200: { description: "Updated task" },
      400: { description: "Validation error" },
      401: { description: "Unauthorized" },
      403: { description: "Day is read-only" },
      404: { description: "Not a member of that team" },
    },
    security: bearerAuth,
    summary: "Check or uncheck a required task",
    tags: ["Tasks"],
  });

  registry.registerPath({
    method: "get",
    operationId: "getOpenApiSpec",
    path: "/api/v1/openapi.json",
    responses: {
      200: { description: "OpenAPI specification" },
    },
    summary: "Get OpenAPI specification",
    tags: ["OpenAPI"],
  });

  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    info: {
      description:
        "Public REST API for SeventyFive — a 75-day accountability tracker. Authenticate with an API key via Bearer token.",
      title: "SeventyFive API",
      version: "1.0.0",
    },
    openapi: "3.1.0",
    servers: [{ url: baseUrl }],
  });
}
