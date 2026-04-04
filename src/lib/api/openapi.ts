import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

export function generateOpenApiSpec(baseUrl: string) {
  const registry = new OpenAPIRegistry();

  // Security scheme
  registry.registerComponent("securitySchemes", "BearerAuth", {
    bearerFormat: "API Key",
    scheme: "bearer",
    type: "http",
  });

  const bearerAuth = [{ BearerAuth: [] }];

  // ─── Profile ────────────────────────────────────────────────────────────────

  registry.registerPath({
    method: "get",
    operationId: "getMe",
    path: "/api/v1/me",
    responses: {
      200: { description: "Authenticated user profile with summary counts" },
      401: { description: "Unauthorized" },
    },
    security: bearerAuth,
    summary: "Get authenticated user profile",
    tags: ["Profile"],
  });

  registry.registerPath({
    method: "patch",
    operationId: "updateMe",
    path: "/api/v1/me",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              bio: z.string().max(500).optional(),
              displayName: z.string().max(100).optional(),
              pageDarkTheme: z.string().optional(),
              pageLightTheme: z.string().optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: { description: "Updated profile" },
      400: { description: "Validation error" },
      401: { description: "Unauthorized" },
    },
    security: bearerAuth,
    summary: "Update authenticated user profile",
    tags: ["Profile"],
  });

  registry.registerPath({
    method: "get",
    operationId: "getPublicProfile",
    path: "/api/v1/users/{username}",
    request: {
      params: z.object({ username: z.string() }),
    },
    responses: {
      200: { description: "Public user profile with links and groups" },
      404: { description: "User not found" },
    },
    summary: "Get public user profile",
    tags: ["Profile"],
  });

  // ─── Links ──────────────────────────────────────────────────────────────────

  registry.registerPath({
    method: "get",
    operationId: "listLinks",
    path: "/api/v1/links",
    responses: {
      200: { description: "List of all links for the authenticated user" },
      401: { description: "Unauthorized" },
    },
    security: bearerAuth,
    summary: "List all links",
    tags: ["Links"],
  });

  registry.registerPath({
    method: "post",
    operationId: "createLink",
    path: "/api/v1/links",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              groupId: z.string().optional(),
              slug: z.string().optional(),
              title: z.string(),
              url: z.string(),
            }),
          },
        },
      },
    },
    responses: {
      201: { description: "Created link" },
      400: { description: "Validation error" },
      401: { description: "Unauthorized" },
      403: { description: "Link limit reached" },
    },
    security: bearerAuth,
    summary: "Create a link",
    tags: ["Links"],
  });

  registry.registerPath({
    method: "patch",
    operationId: "updateLink",
    path: "/api/v1/links/{id}",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              groupId: z.string().nullable().optional(),
              slug: z.string().optional(),
              title: z.string().optional(),
              url: z.string().optional(),
            }),
          },
        },
      },
      params: z.object({ id: z.string() }),
    },
    responses: {
      200: { description: "Updated link" },
      400: { description: "Validation error" },
      401: { description: "Unauthorized" },
      404: { description: "Link not found" },
    },
    security: bearerAuth,
    summary: "Update a link",
    tags: ["Links"],
  });

  registry.registerPath({
    method: "delete",
    operationId: "deleteLink",
    path: "/api/v1/links/{id}",
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: {
      200: { description: "Link deleted" },
      401: { description: "Unauthorized" },
      404: { description: "Link not found" },
    },
    security: bearerAuth,
    summary: "Delete a link",
    tags: ["Links"],
  });

  registry.registerPath({
    method: "patch",
    operationId: "reorderLinks",
    path: "/api/v1/links/reorder",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              items: z.array(z.object({ id: z.string(), position: z.number() })),
            }),
          },
        },
      },
    },
    responses: {
      200: { description: "Links reordered" },
      401: { description: "Unauthorized" },
    },
    security: bearerAuth,
    summary: "Reorder links",
    tags: ["Links"],
  });

  registry.registerPath({
    method: "patch",
    operationId: "toggleLinkVisibility",
    path: "/api/v1/links/{id}/visibility",
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: {
      200: { description: "Link visibility toggled" },
      401: { description: "Unauthorized" },
      404: { description: "Link not found" },
    },
    security: bearerAuth,
    summary: "Toggle link visibility",
    tags: ["Links"],
  });

  registry.registerPath({
    method: "patch",
    operationId: "toggleLinkFeatured",
    path: "/api/v1/links/{id}/featured",
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: {
      200: { description: "Link featured status toggled" },
      401: { description: "Unauthorized" },
      403: { description: "Pro required" },
      404: { description: "Link not found" },
    },
    security: bearerAuth,
    summary: "Toggle featured link (Pro)",
    tags: ["Links"],
  });

  registry.registerPath({
    method: "post",
    operationId: "bulkDeleteLinks",
    path: "/api/v1/links/bulk/delete",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({ ids: z.array(z.string()) }),
          },
        },
      },
    },
    responses: {
      200: { description: "Links deleted" },
      401: { description: "Unauthorized" },
    },
    security: bearerAuth,
    summary: "Bulk delete links",
    tags: ["Links"],
  });

  registry.registerPath({
    method: "patch",
    operationId: "bulkUpdateVisibility",
    path: "/api/v1/links/bulk/visibility",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({ ids: z.array(z.string()), visible: z.boolean() }),
          },
        },
      },
    },
    responses: {
      200: { description: "Link visibility updated" },
      401: { description: "Unauthorized" },
    },
    security: bearerAuth,
    summary: "Bulk update link visibility",
    tags: ["Links"],
  });

  // ─── Groups ─────────────────────────────────────────────────────────────────

  registry.registerPath({
    method: "get",
    operationId: "listGroups",
    path: "/api/v1/groups",
    responses: {
      200: { description: "List of all groups" },
      401: { description: "Unauthorized" },
      403: { description: "Pro required" },
    },
    security: bearerAuth,
    summary: "List all groups (Pro)",
    tags: ["Groups"],
  });

  registry.registerPath({
    method: "post",
    operationId: "createGroup",
    path: "/api/v1/groups",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              slug: z.string().optional(),
              title: z.string(),
            }),
          },
        },
      },
    },
    responses: {
      201: { description: "Created group" },
      400: { description: "Validation error" },
      401: { description: "Unauthorized" },
      403: { description: "Pro required" },
    },
    security: bearerAuth,
    summary: "Create a group (Pro)",
    tags: ["Groups"],
  });

  registry.registerPath({
    method: "patch",
    operationId: "updateGroup",
    path: "/api/v1/groups/{id}",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              slug: z.string().optional(),
              title: z.string().optional(),
            }),
          },
        },
      },
      params: z.object({ id: z.string() }),
    },
    responses: {
      200: { description: "Updated group" },
      400: { description: "Validation error" },
      401: { description: "Unauthorized" },
      403: { description: "Pro required or Quick Links" },
      404: { description: "Group not found" },
    },
    security: bearerAuth,
    summary: "Update a group (Pro)",
    tags: ["Groups"],
  });

  registry.registerPath({
    method: "delete",
    operationId: "deleteGroup",
    path: "/api/v1/groups/{id}",
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: {
      200: { description: "Group deleted" },
      401: { description: "Unauthorized" },
      403: { description: "Pro required or Quick Links" },
      404: { description: "Group not found" },
    },
    security: bearerAuth,
    summary: "Delete a group (Pro)",
    tags: ["Groups"],
  });

  registry.registerPath({
    method: "patch",
    operationId: "reorderGroups",
    path: "/api/v1/groups/reorder",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              items: z.array(z.object({ id: z.string(), position: z.number() })),
            }),
          },
        },
      },
    },
    responses: {
      200: { description: "Groups reordered" },
      401: { description: "Unauthorized" },
      403: { description: "Pro required" },
    },
    security: bearerAuth,
    summary: "Reorder groups (Pro)",
    tags: ["Groups"],
  });

  registry.registerPath({
    method: "patch",
    operationId: "toggleGroupVisibility",
    path: "/api/v1/groups/{id}/visibility",
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: {
      200: { description: "Group visibility toggled" },
      401: { description: "Unauthorized" },
      403: { description: "Pro required" },
      404: { description: "Group not found" },
    },
    security: bearerAuth,
    summary: "Toggle group visibility (Pro)",
    tags: ["Groups"],
  });

  // ─── Analytics ──────────────────────────────────────────────────────────────

  const dateRangeParams = z.object({
    end: z.string().optional(),
    start: z.string().optional(),
  });

  registry.registerPath({
    method: "get",
    operationId: "getAnalyticsSummary",
    path: "/api/v1/analytics",
    request: { query: dateRangeParams },
    responses: {
      200: { description: "Analytics summary (total clicks, top link, top country)" },
      401: { description: "Unauthorized" },
      403: { description: "Pro required" },
    },
    security: bearerAuth,
    summary: "Get analytics summary (Pro)",
    tags: ["Analytics"],
  });

  registry.registerPath({
    method: "get",
    operationId: "getAnalyticsLinks",
    path: "/api/v1/analytics/links",
    request: { query: dateRangeParams },
    responses: {
      200: { description: "Per-link click breakdown" },
      401: { description: "Unauthorized" },
      403: { description: "Pro required" },
    },
    security: bearerAuth,
    summary: "Get per-link analytics (Pro)",
    tags: ["Analytics"],
  });

  registry.registerPath({
    method: "get",
    operationId: "getAnalyticsReferrers",
    path: "/api/v1/analytics/referrers",
    request: { query: dateRangeParams },
    responses: {
      200: { description: "Referrer data" },
      401: { description: "Unauthorized" },
      403: { description: "Pro required" },
    },
    security: bearerAuth,
    summary: "Get referrer analytics (Pro)",
    tags: ["Analytics"],
  });

  registry.registerPath({
    method: "get",
    operationId: "getAnalyticsDevices",
    path: "/api/v1/analytics/devices",
    request: { query: dateRangeParams },
    responses: {
      200: { description: "Device/browser/OS breakdown" },
      401: { description: "Unauthorized" },
      403: { description: "Pro required" },
    },
    security: bearerAuth,
    summary: "Get device analytics (Pro)",
    tags: ["Analytics"],
  });

  registry.registerPath({
    method: "get",
    operationId: "getAnalyticsHistory",
    path: "/api/v1/analytics/history",
    request: { query: dateRangeParams },
    responses: {
      200: { description: "Time-series click history" },
      401: { description: "Unauthorized" },
      403: { description: "Pro required" },
    },
    security: bearerAuth,
    summary: "Get click history (Pro)",
    tags: ["Analytics"],
  });

  // ─── Webhooks ───────────────────────────────────────────────────────────────

  const webhookEventEnum = z.enum([
    "link.created",
    "link.updated",
    "link.deleted",
    "group.created",
    "group.updated",
    "group.deleted",
  ]);

  registry.registerPath({
    method: "get",
    operationId: "listWebhooks",
    path: "/api/v1/webhooks",
    responses: {
      200: { description: "List of user's webhooks" },
      401: { description: "Unauthorized" },
    },
    security: bearerAuth,
    summary: "List all webhooks",
    tags: ["Webhooks"],
  });

  registry.registerPath({
    method: "post",
    operationId: "createWebhook",
    path: "/api/v1/webhooks",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              events: z.array(webhookEventEnum).min(1),
              url: z.string().url(),
            }),
          },
        },
      },
    },
    responses: {
      201: { description: "Created webhook (includes signing secret — shown once)" },
      400: { description: "Validation error" },
      401: { description: "Unauthorized" },
      403: { description: "Webhook limit reached" },
    },
    security: bearerAuth,
    summary: "Create a webhook",
    tags: ["Webhooks"],
  });

  registry.registerPath({
    method: "patch",
    operationId: "updateWebhook",
    path: "/api/v1/webhooks/{id}",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              active: z.boolean().optional(),
              events: z.array(webhookEventEnum).min(1).optional(),
              url: z.string().url().optional(),
            }),
          },
        },
      },
      params: z.object({ id: z.string() }),
    },
    responses: {
      200: { description: "Updated webhook" },
      400: { description: "Validation error" },
      401: { description: "Unauthorized" },
      404: { description: "Webhook not found" },
    },
    security: bearerAuth,
    summary: "Update a webhook",
    tags: ["Webhooks"],
  });

  registry.registerPath({
    method: "delete",
    operationId: "deleteWebhook",
    path: "/api/v1/webhooks/{id}",
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: {
      200: { description: "Webhook deleted" },
      401: { description: "Unauthorized" },
      404: { description: "Webhook not found" },
    },
    security: bearerAuth,
    summary: "Delete a webhook",
    tags: ["Webhooks"],
  });

  registry.registerPath({
    method: "get",
    operationId: "listWebhookDeliveries",
    path: "/api/v1/webhooks/{id}/deliveries",
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: {
      200: { description: "Recent delivery log (7-day retention)" },
      401: { description: "Unauthorized" },
      404: { description: "Webhook not found" },
    },
    security: bearerAuth,
    summary: "List webhook deliveries",
    tags: ["Webhooks"],
  });

  registry.registerPath({
    method: "post",
    operationId: "testWebhook",
    path: "/api/v1/webhooks/{id}/test",
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: {
      200: { description: "Test event sent" },
      401: { description: "Unauthorized" },
      404: { description: "Webhook not found" },
    },
    security: bearerAuth,
    summary: "Send a test webhook event",
    tags: ["Webhooks"],
  });

  // ─── OpenAPI ────────────────────────────────────────────────────────────────

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

  // ─── Generate ───────────────────────────────────────────────────────────────

  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    info: {
      description: "Public REST API for Anchr — a link-in-bio platform. Authenticate with an API key via Bearer token.",
      title: "Anchr API",
      version: "1.0.0",
    },
    openapi: "3.1.0",
    servers: [{ url: baseUrl }],
  });
}
