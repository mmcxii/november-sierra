"use client";

import { savePushSubscriptionAction } from "@/lib/actions/member";
import { ensurePushSubscription } from "@/lib/browser/ensure-push-subscription";
import * as React from "react";

export type PushSubscriptionSyncProps = {
  enabled: boolean;
  vapidPublicKey?: string;
};

/**
 * Quietly re-registers / refreshes the Web Push subscription when reminders are
 * on. iOS can drop push endpoints after SW updates; syncing on app open recovers them.
 */
export const PushSubscriptionSync: React.FC<PushSubscriptionSyncProps> = (props) => {
  const { enabled, vapidPublicKey } = props;

  //* Effects
  React.useEffect(() => {
    if (!enabled || vapidPublicKey == null || vapidPublicKey === "") {
      return;
    }

    void (async () => {
      try {
        const payload = await ensurePushSubscription(vapidPublicKey);
        if (payload == null) {
          return;
        }
        await savePushSubscriptionAction(payload);
      } catch {
        // Best-effort; settings save path surfaces errors to the user.
      }
    })();
  }, [enabled, vapidPublicKey]);

  return null;
};
