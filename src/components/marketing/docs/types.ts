export type HttpMethod = "delete" | "get" | "patch" | "post";

export type EndpointParam = {
  in: "path" | "query";
  name: string;
  required: boolean;
  type: string;
};

export type EndpointBody = {
  properties: Record<string, { description?: string; nullable?: boolean; type: string }>;
  required: string[];
};

export type EndpointResponse = {
  description: string;
  statusCode: string;
};

export type ParsedEndpoint = {
  body: null | EndpointBody;
  codeExamples: { curl: string; javascript: string; python: string };
  method: HttpMethod;
  operationId: string;
  params: EndpointParam[];
  path: string;
  requiresAuth: boolean;
  responses: EndpointResponse[];
  summary: string;
  tag: string;
};

export type ResourceGroup = {
  endpoints: ParsedEndpoint[];
  tag: string;
};
