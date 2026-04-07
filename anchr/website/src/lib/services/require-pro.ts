import type { ApiKeyUser } from "@/lib/api/auth";
import { API_ERROR_CODES } from "@/lib/api/errors";
import { serviceError, type ServiceResult } from "./types";

export function requirePro(user: ApiKeyUser): null | ServiceResult<never> {
  if (user.tier !== "pro") {
    return serviceError(API_ERROR_CODES.PRO_REQUIRED, "This endpoint requires a Pro subscription.", 403);
  }
  return null;
}
