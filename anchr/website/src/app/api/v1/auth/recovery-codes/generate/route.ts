import { issueRecoveryCodesForUser } from "@/lib/better-auth/recovery-codes";
import { auth as betterAuth } from "@/lib/better-auth/server";
import { headers } from "next/headers";

// Authenticated: user regenerates their own recovery codes. Invalidates the
// previous set (`issueRecoveryCodesForUser` deletes first). Returns the 10
// plaintext codes — they're shown exactly once.
//
// Rate limiting: covered by the middleware /api/v1/auth/* recovery-codes
// bucket (20/IP/hour). No per-user cap on generation — users may legitimately
// regenerate several times during initial setup.
export async function POST(): Promise<Response> {
  const session = await betterAuth.api.getSession({ headers: await headers() });
  if (session?.user.id == null) {
    return new Response("Unauthorized", { status: 401 });
  }

  const codes = await issueRecoveryCodesForUser(session.user.id);
  return Response.json({ codes });
}
