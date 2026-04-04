import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { lookupProfile } from "@/lib/services/discovery";

type RouteParams = { params: Promise<{ username: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { username } = await params;
  const result = await lookupProfile(username);
  if (result.error != null) {
    return apiError(result.error.code, result.error.message, result.error.status);
  }
  return apiSuccess(result.data);
}

export function OPTIONS() {
  return apiOptions();
}
