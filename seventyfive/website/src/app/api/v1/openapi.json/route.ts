import { generateOpenApiSpec } from "@/lib/api/openapi";
import { apiOptions } from "@/lib/api/response";
import { SITE_URL } from "@/lib/constants";

export function GET() {
  const spec = generateOpenApiSpec(process.env.NEXT_PUBLIC_APP_URL ?? SITE_URL);

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
