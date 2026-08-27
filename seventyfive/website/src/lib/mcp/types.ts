export type McpUser = {
  id: string;
  timeZone: string;
  username: null | string;
};

export type ServiceSuccess<T> = { data: T; error: null };
export type ServiceError = { data: null; error: { code: string; message: string } };
export type ServiceResult<T> = ServiceError | ServiceSuccess<T>;

export function serviceSuccess<T>(data: T): ServiceSuccess<T> {
  return { data, error: null };
}

export function serviceError(code: string, message: string): ServiceError {
  return { data: null, error: { code, message } };
}
