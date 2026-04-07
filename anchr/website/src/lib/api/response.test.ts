import { describe, expect, it } from "vitest";
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

  it("supports custom status codes", async () => {
    //* Act
    const response = apiSuccess({ id: "1" }, 201);

    //* Assert
    expect(response.status).toBe(201);
  });

  it("handles null data", async () => {
    //* Act
    const response = apiSuccess(null);
    const body = await response.json();

    //* Assert
    expect(body).toEqual({ data: null });
  });

  it("handles array data", async () => {
    //* Act
    const response = apiSuccess([1, 2, 3]);
    const body = await response.json();

    //* Assert
    expect(body).toEqual({ data: [1, 2, 3] });
  });
});

describe("apiError", () => {
  it("returns JSON with error wrapper and CORS headers", async () => {
    //* Act
    const response = apiError("NOT_FOUND", "User not found.", 404);
    const body = await response.json();

    //* Assert
    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "User not found.",
      },
    });
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("returns correct status for 401", async () => {
    //* Act
    const response = apiError("UNAUTHORIZED", "Invalid API key.", 401);

    //* Assert
    expect(response.status).toBe(401);
  });

  it("returns correct status for 400", async () => {
    //* Act
    const response = apiError("VALIDATION_ERROR", "Invalid input.", 400);

    //* Assert
    expect(response.status).toBe(400);
  });
});

describe("apiOptions", () => {
  it("returns 204 with CORS headers", () => {
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
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain("Content-Type");
  });
});
