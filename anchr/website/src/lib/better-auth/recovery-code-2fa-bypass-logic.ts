import { type RecoveryRedeemResult } from "./recovery-codes-logic";

// Pure-logic extraction of the recovery-code 2FA bypass flow. The BA plugin
// endpoint is a thin wrapper over this that adapts `ctx.context.internalAdapter`
// / `ctx.getSignedCookie` / `setSessionCookie` to the `BypassDeps` shape.
// Keeping the orchestration in a framework-free module lets us exercise every
// branch (no cookie, stale verification, missing user, invalid code, locked,
// session-creation failure, happy path) with an in-memory fake instead of a
// full BA stack.

export type BypassUser = { email: string; id: string };
export type BypassVerification = { value: string };
export type BypassSession = { token: string; userId: string };

export type BypassDeps = {
  createSession: (userId: string) => Promise<null | BypassSession>;
  deleteVerification: (id: string) => Promise<void>;
  findUserById: (id: string) => Promise<null | BypassUser>;
  findVerificationValue: (id: string) => Promise<null | BypassVerification>;
  readSignedTwoFactorCookie: () => Promise<null | string>;
  redeem: (userId: string, code: string) => Promise<RecoveryRedeemResult>;
  setSessionCookie: (session: BypassSession, user: BypassUser) => Promise<void>;
};

export type BypassResult =
  | { kind: "failed_to_create_session" }
  | { kind: "invalid_code" }
  | { kind: "invalid_two_factor_cookie" }
  | { kind: "locked"; lockedUntil: Date }
  | { kind: "ok" };

export async function redeemRecoveryCodeForTwoFactorBypass(deps: BypassDeps, code: string): Promise<BypassResult> {
  const signedCookie = await deps.readSignedTwoFactorCookie();
  if (signedCookie == null || signedCookie.length === 0) {
    return { kind: "invalid_two_factor_cookie" };
  }

  const verification = await deps.findVerificationValue(signedCookie);
  if (verification == null) {
    return { kind: "invalid_two_factor_cookie" };
  }

  const user = await deps.findUserById(verification.value);
  if (user == null) {
    return { kind: "invalid_two_factor_cookie" };
  }

  const result = await deps.redeem(user.id, code);
  if (result.kind === "locked") {
    return { kind: "locked", lockedUntil: result.lockedUntil };
  }
  if (result.kind === "invalid") {
    return { kind: "invalid_code" };
  }

  const session = await deps.createSession(user.id);
  if (session == null) {
    return { kind: "failed_to_create_session" };
  }
  await deps.setSessionCookie(session, user);
  await deps.deleteVerification(signedCookie);

  return { kind: "ok" };
}
