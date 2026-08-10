import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  basePath: "/api/auth",
  plugins: [usernameClient()],
});

export const { signIn, signOut, useSession } = authClient;
