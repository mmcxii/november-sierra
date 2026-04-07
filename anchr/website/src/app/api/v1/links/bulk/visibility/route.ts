import { API_ERROR_CODES } from "@/lib/api/errors";
import { requireApiAuth } from "@/lib/api/require-auth";
import { apiError, apiOptions, apiSuccess } from "@/lib/api/response";
import { bulkVisibilitySchema } from "@/lib/api/schemas/link";
import { db } from "@/lib/db/client";
import { linksTable } from "@/lib/db/schema/link";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function PATCH(request: Request) {
  const auth = await requireApiAuth(request);

  if (auth.user == null) {
    return auth.response;
  }

  const { user } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid JSON body.", 400);
  }

  const parsed = bulkVisibilitySchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    return apiError(API_ERROR_CODES.VALIDATION_ERROR, message, 400);
  }

  const { ids, visible } = parsed.data;

  const updated = await db
    .update(linksTable)
    .set({ visible })
    .where(and(inArray(linksTable.id, ids), eq(linksTable.userId, user.id)));

  revalidatePath("/dashboard");
  revalidatePath(`/${user.username}`);

  return apiSuccess({ updatedCount: updated.rowCount ?? 0 });
}

export function OPTIONS() {
  return apiOptions();
}
