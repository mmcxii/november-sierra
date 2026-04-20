"use client";

import { dismissAlert } from "@/app/(dashboard)/dashboard/import-actions";
import { dismissDomainRemovedBanner } from "@/app/(dashboard)/dashboard/settings/actions";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/auth";
import { useStripeCheckout } from "@/lib/use-stripe-checkout";
import { cn } from "@/lib/utils";
import { Loader2, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { SIGNUP_GRANT_WELCOME_ALERT_ID, VARIANT_CONFIG, resolveVariant } from "./utils";

export type BillingBannerProps = {
  user: SessionUser;
};

/**
 * Global dashboard billing banner shown at the top of every dashboard page.
 *
 * Renders at most ONE banner at a time, prioritized by urgency:
 *   1. payment-failed (red)       — Stripe is retrying the card, user must act
 *   2. domain-removed (amber)     — user's custom domain was removed on downgrade
 *   3. referral-expiring (gold)   — referral/signup Pro expires within 7 days
 *   4. signup-grant-welcome (gold) — first week of signup grant, dismissible
 *
 * Renders nothing for healthy Pro or normal free-tier users.
 */
export const BillingBanner: React.FC<BillingBannerProps> = (props) => {
  const { user } = props;

  //* State
  const { t } = useTranslation();
  const [dismissed, setDismissed] = React.useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = React.useState(false);
  const { loading: upgradeLoading, startCheckout } = useStripeCheckout();

  //* Variables
  const variant = resolveVariant(user);
  const config = variant != null ? VARIANT_CONFIG[variant] : null;
  const Icon = config?.icon ?? null;
  const message = config != null ? config.getMessage(t, user) : "";

  //* Handlers
  const handleDismissDomainBanner = () => {
    setDismissed(true);
    void dismissDomainRemovedBanner();
  };

  const handleDismissWelcomeBanner = () => {
    setWelcomeDismissed(true);
    void dismissAlert(SIGNUP_GRANT_WELCOME_ALERT_ID);
  };

  const handleUpgradeClick = () => {
    void startCheckout();
  };

  if (variant == null || config == null || Icon == null || dismissed) {
    return null;
  }

  if (variant === "signup-grant-welcome" && welcomeDismissed) {
    return null;
  }

  return (
    <div className={cn("mb-4 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm", config.classes)} role="alert">
      <Icon className={cn("mt-0.5 size-4 shrink-0", config.iconClasses)} />
      <p className="flex-1">{message}</p>
      <div className="flex shrink-0 items-center gap-2">
        {variant === "payment-failed" && (
          <Button asChild size="sm" variant="secondary">
            <Link href="/dashboard/settings">{t("updatePaymentMethod")}</Link>
          </Button>
        )}
        {variant === "referral-expiring" && (
          <Button disabled={upgradeLoading} onClick={handleUpgradeClick} size="sm">
            {upgradeLoading && <Loader2 className="size-3.5 animate-spin" />}
            {t("upgradeToPro")}
          </Button>
        )}
        {variant === "domain-removed" && (
          <>
            <Button disabled={upgradeLoading} onClick={handleUpgradeClick} size="sm">
              {upgradeLoading && <Loader2 className="size-3.5 animate-spin" />}
              {t("upgradeToPro")}
            </Button>
            <button
              aria-label={t("dismiss")}
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={handleDismissDomainBanner}
              type="button"
            >
              <X className="size-4" />
            </button>
          </>
        )}
        {variant === "signup-grant-welcome" && (
          <button
            aria-label={t("dismiss")}
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleDismissWelcomeBanner}
            type="button"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
};
