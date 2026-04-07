import { generateOpenApiSpec } from "@/lib/api/openapi";
import { apiOptions } from "@/lib/api/response";
import { envSchema } from "@/lib/env";

export function GET() {
  const spec = generateOpenApiSpec(envSchema.NEXT_PUBLIC_APP_URL);

  return Response.json(spec, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export function OPTIONS() {
  return apiOptions();
}
