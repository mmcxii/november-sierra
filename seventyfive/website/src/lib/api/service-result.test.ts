import { serviceError, serviceSuccess } from "@/lib/mcp/types";
import { describe, expect, it } from "vitest";
import { serviceResultToResponse } from "./service-result";

describe("serviceResultToResponse", () => {
  it("wraps success data", async () => {
    //* Act
    const response = serviceResultToResponse(serviceSuccess({ ok: true }));
    const body = await response.json();

    //* Assert
    expect(response.status).toBe(200);
    expect(body).toEqual({ data: { ok: true } });
  });

  it("maps NOT_FOUND to 404", async () => {
    //* Act
    const response = serviceResultToResponse(serviceError("NOT_FOUND", "You are not a member of that team."));
    const body = await response.json();

    //* Assert
    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("maps thisDayIsReadOnly to 403 FORBIDDEN", async () => {
    //* Act
    const response = serviceResultToResponse(serviceError("thisDayIsReadOnly", "This day is read-only."));
    const body = await response.json();

    //* Assert
    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("maps INVALID_DATE to 400 VALIDATION_ERROR", async () => {
    //* Act
    const response = serviceResultToResponse(serviceError("INVALID_DATE", "date must be YYYY-MM-DD."));
    const body = await response.json();

    //* Assert
    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
