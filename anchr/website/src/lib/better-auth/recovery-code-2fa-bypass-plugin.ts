import { redeemRecoveryCode } from "@/lib/better-auth/recovery-codes";
import { createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { z } from "zod";
import { redeemRecoveryCodeForTwoFactorBypass } from "./recovery-code-2fa-bypass-logic";

// BA TWO_FACTOR_COOKIE_NAME — kept in sync with the constant BA uses
// internally (src/plugins/two-factor/constant.ts). If BA renames it we'll
// get a silent no-op here, so keep an eye on it when bumping BA.
const TWO_FACTOR_COOKIE_NAME = "two_factor";

// Custom BA plugin that lets a user sitting at the 2FA prompt bypass the
// email-OTP gate by redeeming one of their recovery codes. Without this the
// user's only escape hatch is email access, which is exactly what recovery
// codes exist to cover.
//
// The endpoint is a thin adapter over redeemRecoveryCodeForTwoFactorBypass:
// it wires BA's signed-cookie reader, internalAdapter, and setSessionCookie
// into the BypassDeps shape and translates the BypassResult into HTTP. All
// the orchestration logic (cookie → verification → user → redeem → session)
// lives in the logic module so it can be tested with an in-memory fake.
export const recoveryCode2faBypassPlugin = () => {
  return {
    endpoints: {
      redeemRecoveryCodeForTwoFactorBypass: createAuthEndpoint(
        "/recovery-code-2fa-bypass",
        {
          body: z.object({
            code: z.string().min(1),
          }),
          method: "POST",
        },
        async (ctx) => {
          const twoFactorCookie = ctx.context.createAuthCookie(TWO_FACTOR_COOKIE_NAME);
          const result = await redeemRecoveryCodeForTwoFactorBypass(
            {
              redeem: redeemRecoveryCode,
              createSession: async (userId) => {
                const session = await ctx.context.internalAdapter.createSession(userId, false);
                return session == null ? null : { token: session.token, userId: session.userId };
              },
              deleteVerification: async (id) => {
                await ctx.context.internalAdapter.deleteVerificationByIdentifier(id);
              },
              findUserById: async (id) => {
                const user = await ctx.context.internalAdapter.findUserById(id);
                return user == null ? null : { email: user.email, id: user.id };
              },
              findVerificationValue: async (id) => {
                const verification = await ctx.context.internalAdapter.findVerificationValue(id);
                return verification == null ? null : { value: verification.value };
              },
              readSignedTwoFactorCookie: async () => {
                const signed = await ctx.getSignedCookie(twoFactorCookie.name, ctx.context.secret);
                return typeof signed === "string" && signed.length > 0 ? signed : null;
              },
              setSessionCookie: async (session, user) => {
                // BA's setSessionCookie expects the full session+user shape it
                // receives from internalAdapter.createSession. We re-fetch
                // both to satisfy the wire types — the in-memory test path
                // bypasses this entirely.
                const fullSession = await ctx.context.internalAdapter.findSession(session.token);
                if (fullSession == null) {
                  return;
                }
                await setSessionCookie(ctx, { session: fullSession.session, user: fullSession.user });
                void user;
              },
            },
            ctx.body.code,
          );

          if (result.kind === "ok") {
            return ctx.json({ ok: true });
          }
          if (result.kind === "invalid_two_factor_cookie") {
            return ctx.json({ error: "invalid_two_factor_cookie" }, { status: 401 });
          }
          if (result.kind === "invalid_code") {
            return ctx.json({ error: "invalid_code" }, { status: 400 });
          }
          if (result.kind === "locked") {
            return ctx.json({ error: "locked", lockedUntil: result.lockedUntil.toISOString() }, { status: 429 });
          }
          return ctx.json({ error: "failed_to_create_session" }, { status: 500 });
        },
      ),
    },
    id: "recovery-code-2fa-bypass",
  } as const;
};
