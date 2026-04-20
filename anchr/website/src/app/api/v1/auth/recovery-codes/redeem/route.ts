import { checkRecoveryCodePerUserRateLimit } from "@/lib/api/rate-limit";
import { redeemRecoveryCode } from "@/lib/better-auth/recovery-codes";
import { auth as betterAuth } from "@/lib/better-auth/server";
import { headers } from "next/headers";
import { z } from "zod";

const bodySchema = z.object({
  code: z.string().min(1),
});

// Redeems a recovery code for the current session's user.
//
// Rate limiting: layered. Middleware applies 20/IP/hour via the /api/v1/auth
// recovery-codes bucket; this handler additionally enforces 5/user/hour so
// an attacker spreading IPs can't bypass the per-account cap. Beyond that,
// redeemRecoveryCode() itself tracks failed-attempt counts in recovery_lockouts
// and triggers the 24h account lockout after 10 consecutive misses.
export async function POST(req: Request): Promise<Response> {
  const session = await betterAuth.api.getSession({ headers: await headers() });
  if (session?.user.id == null) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userLimit = await checkRecoveryCodePerUserRateLimit(session.user.id);
  if (userLimit.limited && userLimit.response != null) {
    return userLimit.response;
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const result = await redeemRecoveryCode(session.user.id, parsed.data.code);
  if (result.kind === "locked") {
    return Response.json({ error: "locked", lockedUntil: result.lockedUntil.toISOString() }, { status: 429 });
  }
  if (result.kind === "invalid") {
    return Response.json({ error: "invalid_code" }, { status: 400 });
  }
  return Response.json({ ok: true });
}
