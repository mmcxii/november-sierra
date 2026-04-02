import type { ApiErrorCode } from "@/lib/api/errors";

export type ServiceSuccess<T> = { data: T; error: null };
export type ServiceError = { data: null; error: { code: ApiErrorCode; message: string; status: number } };
export type ServiceResult<T> = ServiceError | ServiceSuccess<T>;

export function serviceSuccess<T>(data: T): ServiceSuccess<T> {
  return { data, error: null };
}

export function serviceError(code: ApiErrorCode, message: string, status: number): ServiceError {
  return { data: null, error: { code, message, status } };
}
