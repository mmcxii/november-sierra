import type { ServiceResult } from "@/lib/mcp/types";
import { API_ERROR_CODES } from "./errors";
import { apiError, apiSuccess } from "./response";

export function serviceResultToResponse<T>(result: ServiceResult<T>): Response {
  if (result.error != null) {
    if (result.error.code === "NOT_FOUND") {
      return apiError(API_ERROR_CODES.NOT_FOUND, result.error.message, 404);
    }
    if (result.error.code === "thisDayIsReadOnly") {
      return apiError(API_ERROR_CODES.FORBIDDEN, result.error.message, 403);
    }
    if (result.error.code === "INVALID_DATE" || result.error.code === "somethingWentWrong") {
      return apiError(API_ERROR_CODES.VALIDATION_ERROR, result.error.message, 400);
    }
    return apiError(API_ERROR_CODES.INTERNAL_ERROR, result.error.message, 500);
  }

  return apiSuccess(result.data);
}
