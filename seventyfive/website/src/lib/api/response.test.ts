import { describe, expect, it } from "vitest";
import { API_ERROR_CODES } from "./errors";
import { apiError, apiOptions, apiSuccess } from "./response";

describe("apiSuccess", () => {
  it("returns JSON with data wrapper and CORS headers", async () => {
    //* Act
    const response = apiSuccess({ foo: "bar" });
    const body = await response.json();

    //* Assert
    expect(response.status).toBe(200);
    expect(body).toEqual({ data: { foo: "bar" } });
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

describe("apiError", () => {
  it("returns JSON with error wrapper and CORS headers", async () => {
    //* Act
    const response = apiError(API_ERROR_CODES.NOT_FOUND, "You are not a member of that team.", 404);
    const body = await response.json();

    //* Assert
    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "You are not a member of that team.",
      },
    });
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

describe("apiOptions", () => {
  it("returns 204 with CORS headers including PATCH", () => {
    //* Act
    const response = apiOptions();

    //* Assert
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("GET");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("PATCH");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("DELETE");
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain("Authorization");
  });
});
