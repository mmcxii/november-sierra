import { API_ERROR_CODES } from "@/lib/api/errors";
import { requireApiAuth } from "@/lib/api/require-auth";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { updateProfileSchema } from "@/lib/api/schemas/profile";
import { getProfile, updateProfile, updateTheme } from "@/lib/services/profile";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);

  if (auth.user == null) {
    return auth.response;
  }

  const result = await getProfile(auth.user);

  if (result.error != null) {
    return apiError(result.error.code, result.error.message, result.error.status);
  }

  return apiSuccess(result.data);
}

export async function PATCH(request: Request) {
  const auth = await requireApiAuth(request);

  if (auth.user == null) {
    return auth.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid JSON body.", 400);
  }

  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }

  const { bio, displayName, pageDarkTheme, pageLightTheme } = parsed.data;

  // Handle theme updates if any theme fields are provided
  if (pageDarkTheme !== undefined || pageLightTheme !== undefined) {
    const themeResult = await updateTheme(auth.user, { pageDarkTheme, pageLightTheme });

    if (themeResult.error != null) {
      return apiError(themeResult.error.code, themeResult.error.message, themeResult.error.status);
    }

    // If only theme fields were provided, return the theme result
    if (bio === undefined && displayName === undefined) {
      return apiSuccess(themeResult.data);
    }
  }

  // Handle profile updates (displayName, bio)
  if (bio !== undefined || displayName !== undefined) {
    const profileResult = await updateProfile(auth.user, { bio, displayName });

    if (profileResult.error != null) {
      return apiError(profileResult.error.code, profileResult.error.message, profileResult.error.status);
    }

    return apiSuccess(profileResult.data);
  }

  // No fields provided — return current profile
  const result = await getProfile(auth.user);

  if (result.error != null) {
    return apiError(result.error.code, result.error.message, result.error.status);
  }

  return apiSuccess(result.data);
}

export function OPTIONS() {
  return apiOptions();
}
