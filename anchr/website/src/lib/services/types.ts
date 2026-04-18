import type { ApiErrorCode } from "@/lib/api/errors";

export type ServiceSuccess<T> = { data: T; error: null };
export type ServiceError = {
  data: null;
  error: { code: ApiErrorCode; details?: Record<string, unknown>; message: string; status: number };
};
export type ServiceResult<T> = ServiceError | ServiceSuccess<T>;

export function serviceSuccess<T>(data: T): ServiceSuccess<T> {
  return { data, error: null };
}

export function serviceError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: Record<string, unknown>,
): ServiceError {
  return { data: null, error: { code, details, message, status } };
}
