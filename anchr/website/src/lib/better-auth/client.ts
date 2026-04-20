import { emailOTPClient, twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Must match the server basePath in src/lib/better-auth/server.ts.
  basePath: "/api/v1/auth",
  plugins: [emailOTPClient(), twoFactorClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;
