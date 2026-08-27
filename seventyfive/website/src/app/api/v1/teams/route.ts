import { requireApiAuth } from "@/lib/api/require-auth";
import { apiOptions } from "@/lib/api/response";
import { serviceResultToResponse } from "@/lib/api/service-result";
import { listTeams } from "@/lib/mcp/services/teams";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth.user == null) {
    return auth.response;
  }

  const result = await listTeams(auth.user);
  return serviceResultToResponse(result);
}

export function OPTIONS() {
  return apiOptions();
}
