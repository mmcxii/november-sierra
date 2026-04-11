"use client";

import { createCheckoutSession } from "@/app/(dashboard)/dashboard/settings/actions";
import type { TranslationKey } from "@/lib/i18n/i18next.d";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

/**
 * Opens a Stripe checkout session and redirects the browser on success.
 * Shared by the settings Current Plan card, the sidebar upgrade card, and
 * the marketing pricing page. Surfaces a toast on failure and exposes a
 * loading flag for the caller to disable its trigger.
 */
export function useStripeCheckout(): { loading: boolean; startCheckout: () => Promise<void> } {
  //* State
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(false);

  //* Handlers
  const startCheckout = async () => {
    setLoading(true);
    try {
      const result = await createCheckoutSession();
      if (result.success) {
        if (result.url != null) {
          window.location.href = result.url;
        }
        return;
      }
      toast.error(t(result.error as TranslationKey));
    } catch {
      toast.error(t("somethingWentWrongPleaseTryAgain"));
    } finally {
      setLoading(false);
    }
  };

  return { loading, startCheckout };
}
