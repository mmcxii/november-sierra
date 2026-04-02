import type { EndpointBody, EndpointParam, EndpointResponse, HttpMethod, ParsedEndpoint, ResourceGroup } from "./types";

type OpenApiSpec = {
  paths: Record<string, Record<string, OpenApiOperation>>;
  servers: Array<{ url: string }>;
};

type OpenApiOperation = {
  operationId?: string;
  parameters?: Array<{
    in: string;
    name: string;
    required?: boolean;
    schema?: { type?: string };
  }>;
  requestBody?: {
    content?: {
      "application/json"?: {
        schema?: {
          properties?: Record<string, { description?: string; nullable?: boolean; type?: string }>;
          required?: string[];
        };
      };
    };
  };
  responses?: Record<string, { description?: string }>;
  security?: Array<Record<string, unknown>>;
  summary?: string;
  tags?: string[];
};

const METHOD_ORDER: HttpMethod[] = ["get", "post", "patch", "delete"];
const TAG_ORDER = ["Profile", "Links", "Groups", "Analytics"];

function buildCodeExamples(
  method: HttpMethod,
  path: string,
  baseUrl: string,
  requiresAuth: boolean,
  body: null | EndpointBody,
): { curl: string; javascript: string; python: string } {
  const fullUrl = `${baseUrl}${path}`;

  const exampleUrl = fullUrl.replace(/{(\w+)}/g, (_match, param) => {
    if (param === "username") {
      return "alice";
    }
    if (param === "id") {
      return "abc123";
    }
    return `example-${param}`;
  });

  const bodyExample =
    body != null
      ? JSON.stringify(
          Object.fromEntries(
            Object.entries(body.properties).map(([key, val]) => {
              if (val.type === "boolean") {
                return [key, true];
              }
              if (val.type === "number" || val.type === "integer") {
                return [key, 0];
              }
              if (val.type === "array") {
                return [key, []];
              }
              return [key, `your-${key}`];
            }),
          ),
          null,
          2,
        )
      : null;

  // curl
  let curl = `curl`;
  if (method !== "get") {
    curl += ` -X ${method.toUpperCase()}`;
  }
  curl += ` "${exampleUrl}"`;
  if (requiresAuth) {
    curl += ` \\\n  -H "Authorization: Bearer anc_k_YOUR_KEY"`;
  }
  if (bodyExample != null) {
    curl += ` \\\n  -H "Content-Type: application/json"`;
    curl += ` \\\n  -d '${bodyExample}'`;
  }

  // JavaScript
  let javascript = "";
  if (method === "get" && bodyExample == null) {
    javascript += `const response = await fetch("${exampleUrl}"`;
    if (requiresAuth) {
      javascript += `, {\n  headers: {\n    Authorization: "Bearer anc_k_YOUR_KEY",\n  },\n}`;
    }
    javascript += `);\nconst { data } = await response.json();`;
  } else {
    javascript += `const response = await fetch("${exampleUrl}", {\n  method: "${method.toUpperCase()}",\n  headers: {`;
    if (requiresAuth) {
      javascript += `\n    Authorization: "Bearer anc_k_YOUR_KEY",`;
    }
    if (bodyExample != null) {
      javascript += `\n    "Content-Type": "application/json",`;
    }
    javascript += `\n  },`;
    if (bodyExample != null) {
      javascript += `\n  body: JSON.stringify(${bodyExample}),`;
    }
    javascript += `\n});\nconst { data } = await response.json();`;
  }

  // Python
  let python = `import requests\n\n`;
  if (method === "get" && bodyExample == null) {
    python += `response = requests.get("${exampleUrl}"`;
    if (requiresAuth) {
      python += `,\n    headers={"Authorization": "Bearer anc_k_YOUR_KEY"}`;
    }
    python += `)\ndata = response.json()["data"]`;
  } else {
    python += `response = requests.${method}(\n    "${exampleUrl}",`;
    if (requiresAuth) {
      python += `\n    headers={"Authorization": "Bearer anc_k_YOUR_KEY"},`;
    }
    if (bodyExample != null) {
      python += `\n    json=${bodyExample
        .replace(/: true/g, ": True")
        .replace(/: false/g, ": False")
        .replace(/: null/g, ": None")},`;
    }
    python += `\n)\ndata = response.json()["data"]`;
  }

  return { curl, javascript, python };
}

export function parseOpenApiSpec(spec: OpenApiSpec): ResourceGroup[] {
  const baseUrl = spec.servers[0]?.url ?? "";
  const endpointsByTag = new Map<string, ParsedEndpoint[]>();

  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const method of METHOD_ORDER) {
      const operation = methods[method] as undefined | OpenApiOperation;
      if (operation == null) {
        continue;
      }

      const tag = operation.tags?.[0] ?? "Other";
      if (tag === "OpenAPI") {
        continue;
      }

      const requiresAuth = (operation.security ?? []).length > 0;

      const params: EndpointParam[] = (operation.parameters ?? []).map((p) => ({
        in: p.in as "path" | "query",
        name: p.name,
        required: p.required ?? false,
        type: p.schema?.type ?? "string",
      }));

      const pathParamNames = new Set(params.filter((p) => p.in === "path").map((p) => p.name));
      const pathParamMatches = path.matchAll(/{(\w+)}/g);
      for (const match of pathParamMatches) {
        if (!pathParamNames.has(match[1])) {
          params.push({ in: "path", name: match[1], required: true, type: "string" });
        }
      }

      const bodySchema = operation.requestBody?.content?.["application/json"]?.schema;
      let body: null | EndpointBody = null;
      if (bodySchema?.properties != null) {
        body = {
          properties: Object.fromEntries(
            Object.entries(bodySchema.properties).map(([key, val]) => [
              key,
              {
                description: val.description,
                nullable: val.nullable ?? false,
                type: val.type ?? "string",
              },
            ]),
          ),
          required: bodySchema.required ?? [],
        };
      }

      const responses: EndpointResponse[] = Object.entries(operation.responses ?? {}).map(([code, res]) => ({
        description: res.description ?? "",
        statusCode: code,
      }));

      const codeExamples = buildCodeExamples(method, path, baseUrl, requiresAuth, body);

      const endpoint: ParsedEndpoint = {
        body,
        codeExamples,
        method: method as HttpMethod,
        operationId: operation.operationId ?? "",
        params,
        path,
        requiresAuth,
        responses,
        summary: operation.summary ?? "",
        tag,
      };

      const existing = endpointsByTag.get(tag) ?? [];
      existing.push(endpoint);
      endpointsByTag.set(tag, existing);
    }
  }

  const groups = TAG_ORDER.filter((tag) => endpointsByTag.has(tag));
  return groups.map((tag) => ({
    endpoints: endpointsByTag.get(tag) ?? [],
    tag,
  }));
}
