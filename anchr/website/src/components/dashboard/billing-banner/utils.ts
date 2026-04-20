import type { SessionUser } from "@/lib/auth";
import type { UserPreferences } from "@/lib/db/schema/user";
import type { TranslationKey } from "@/lib/i18n/i18next.d";
import { isProUser } from "@/lib/tier";
import { AlertTriangle, CreditCard, PartyPopper, Timer } from "lucide-react";

export type BannerVariant = "domain-removed" | "payment-failed" | "referral-expiring" | "signup-grant-welcome";

// Alert id stored in `users.preferences.dismissedAlerts` when the welcome
// banner's X button is clicked. Matches the existing `"import"` dismissed-alert
// convention used by the import banner — dismissal is global per-user, not
// per-device, so the welcome banner doesn't reappear on a second browser.
export const SIGNUP_GRANT_WELCOME_ALERT_ID = "signup-grant-welcome";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
// Keep in sync with SIGNUP_GRANT_DAYS in `src/lib/tier.server.ts`. Duplicated
// here (not imported) because billing-banner/utils is reachable from client
// bundles via the banner's resolve call and tier.server.ts pulls in the
// Drizzle client + Vercel SDK on import. The value lives in the constant
// there; this threshold is derived from it.
const SIGNUP_GRANT_WELCOME_WINDOW_DAYS = 23;
const SIGNUP_GRANT_WELCOME_WINDOW_MS = SIGNUP_GRANT_WELCOME_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export function resolveVariant(user: SessionUser): null | BannerVariant {
  if (user.paymentFailedAt != null && user.tier === "pro") {
    return "payment-failed";
  }

  if (user.domainRemovedAt != null) {
    return "domain-removed";
  }

  if (
    isProUser(user) &&
    user.proExpiresAt != null &&
    user.stripeSubscriptionId == null &&
    user.proExpiresAt.getTime() - Date.now() < SEVEN_DAYS_MS
  ) {
    return "referral-expiring";
  }

  // Welcome banner for users still in the early portion of their unconditional
  // signup grant (roughly the first week of a 30-day grant). The existing
  // `referral-expiring` variant above handles the last-7-days nudge, so this
  // threshold intentionally only fires on fresh grants. Dismissal lives on
  // `user.preferences.dismissedAlerts` so it persists across devices via the
  // existing `dismissAlert` action.
  const dismissedAlerts = ((user.preferences ?? {}) as UserPreferences).dismissedAlerts ?? [];
  if (
    isProUser(user) &&
    user.proExpiresAt != null &&
    user.stripeSubscriptionId == null &&
    user.proExpiresAt.getTime() - Date.now() > SIGNUP_GRANT_WELCOME_WINDOW_MS &&
    !dismissedAlerts.includes(SIGNUP_GRANT_WELCOME_ALERT_ID)
  ) {
    return "signup-grant-welcome";
  }

  return null;
}

type TFn = (key: TranslationKey, opts?: Record<string, unknown>) => string;

export type VariantConfig = {
  classes: string;
  icon: typeof AlertTriangle;
  iconClasses: string;
  getMessage: (t: TFn, user: SessionUser) => string;
};

export const VARIANT_CONFIG: Record<BannerVariant, VariantConfig> = {
  "domain-removed": {
    classes:
      "border-amber-500/30 bg-amber-50 text-amber-900 dark:border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-200",
    icon: AlertTriangle,
    iconClasses: "text-amber-600 dark:text-amber-400",
    getMessage: (t) => t("yourCustomDomainWasRemovedBecauseYourProSubscriptionEndedUpgradeToReconnectIt"),
  },
  "payment-failed": {
    classes: "border-red-500/30 bg-red-50 text-red-900 dark:border-red-500/20 dark:bg-red-950/40 dark:text-red-200",
    icon: CreditCard,
    iconClasses: "text-red-600 dark:text-red-400",
    getMessage: (t) => t("yourLastPaymentFailedUpdateYourPaymentMethodToKeepPro"),
  },
  "referral-expiring": {
    classes: "border-primary/30 bg-primary/5 text-foreground",
    icon: Timer,
    iconClasses: "text-primary",
    getMessage: (t, user) => {
      const days =
        user.proExpiresAt != null
          ? Math.max(0, Math.ceil((user.proExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
          : 0;
      return t("yourProAccessExpiresIn{{days}}DaysUpgradeToKeepYourFeatures", { days });
    },
  },
  "signup-grant-welcome": {
    classes: "border-primary/30 bg-primary/5 text-foreground",
    icon: PartyPopper,
    iconClasses: "text-primary",
    getMessage: (t, user) => {
      const days =
        user.proExpiresAt != null
          ? Math.max(0, Math.ceil((user.proExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
          : 0;
      return t("welcomeAboardYouHave{{days}}DaysOfProOnUsExploreEveryFeature", { days });
    },
  },
};
