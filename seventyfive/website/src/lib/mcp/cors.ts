export const CORS_HEADERS = {
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

export function apiError(code: string, message: string, status: number): Response {
  return Response.json({ error: { code, message } }, { headers: CORS_HEADERS, status });
}

export function apiOptions(): Response {
  return new Response(null, { headers: CORS_HEADERS, status: 204 });
}
