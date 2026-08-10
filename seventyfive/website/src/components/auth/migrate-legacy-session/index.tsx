"use client";

import { PasswordRevealModal } from "@/components/auth/password-reveal-modal";
import { runLegacyMigrationAction } from "@/lib/actions/migrate";
import * as React from "react";

/** Temporary shim: convert cookie-only members to Better Auth accounts. */
export const MigrateLegacySession: React.FC = () => {
  //* State
  const [pending, setPending] = React.useState<null | { password: string; username: string }>(null);

  //* Effects
  React.useEffect(() => {
    let cancelled = false;
    void runLegacyMigrationAction().then((result) => {
      if (!cancelled && result != null) {
        setPending(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (pending == null) {
    return null;
  }

  return <PasswordRevealModal password={pending.password} username={pending.username} />;
};
