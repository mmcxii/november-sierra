import type { ApiErrorCode } from "./errors";

export const CORS_HEADERS = {
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

export function apiSuccess(data: unknown, status = 200): Response {
  return Response.json({ data }, { headers: CORS_HEADERS, status });
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: Record<string, unknown>,
): Response {
  const body = details != null ? { error: { code, details, message } } : { error: { code, message } };
  return Response.json(body, { headers: CORS_HEADERS, status });
}

export function apiOptions(): Response {
  return new Response(null, { headers: CORS_HEADERS, status: 204 });
}
