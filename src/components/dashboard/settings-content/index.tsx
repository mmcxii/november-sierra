"use client";

import {
  createCheckoutSession,
  createPortalSession,
  updateHideBranding,
  updatePageDarkTheme,
  updatePageLightTheme,
} from "@/app/(dashboard)/dashboard/settings/actions";
import { CheckoutCelebration } from "@/components/dashboard/checkout-celebration";
import { PagePreview } from "@/components/dashboard/page-preview";
import { PreviewToggle } from "@/components/dashboard/preview-toggle";
import { ThemePicker } from "@/components/dashboard/theme-picker";
import { useDashboardTheme } from "@/components/dashboard/theme-provider/context";
import { ThemeSwatch } from "@/components/dashboard/theme-swatch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionUser } from "@/lib/auth";
import { DARK_THEME_ID_LIST, LIGHT_THEME_ID_LIST, THEMES, isDarkTheme, type ThemeId } from "@/lib/themes";
import { isProUser } from "@/lib/tier";
import { Check, Lock } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type SettingsContentProps = {
  checkoutSuccess?: boolean;
  hideBranding: boolean;
  pageDarkThemeId: ThemeId;
  pageLightThemeId: ThemeId;
  user: SessionUser;
};

export const SettingsContent: React.FC<SettingsContentProps> = (props) => {
  const { checkoutSuccess, hideBranding, pageDarkThemeId, pageLightThemeId, user } = props;

  const { t } = useTranslation();
  const { preferredDark, preferredLight, setPreferredDark, setPreferredLight } = useDashboardTheme();
  const [previewThemes, setPreviewThemes] = React.useState({ dark: pageDarkThemeId, light: pageLightThemeId });
  const [brandingHidden, setBrandingHidden] = React.useState(hideBranding);
  const [brandingPending, startBrandingTransition] = React.useTransition();
  const [billingLoading, setBillingLoading] = React.useState(false);
  const [celebrationOpen, setCelebrationOpen] = React.useState(checkoutSuccess === true);
  const isPro = isProUser(user);
  const previewKey = `${previewThemes.dark}|${previewThemes.light}|${brandingHidden}`;

  React.useEffect(() => {
    if (checkoutSuccess) {
      window.history.replaceState(null, "", "/dashboard/settings");
    }
  }, [checkoutSuccess]);

  const handlePageThemeChange = React.useCallback((themeId: ThemeId) => {
    setPreviewThemes((prev) => (isDarkTheme(themeId) ? { ...prev, dark: themeId } : { ...prev, light: themeId }));
  }, []);

  const handleBrandingToggle = () => {
    const newValue = !brandingHidden;
    setBrandingHidden(newValue);

    startBrandingTransition(async () => {
      const result = await updateHideBranding(newValue);

      if (!result.success) {
        setBrandingHidden(!newValue);
        toast.error(t(result.error));
      }
    });
  };

  const handleUpgrade = async () => {
    setBillingLoading(true);
    try {
      const result = await createCheckoutSession();
      if (result.success) {
        if (result.url != null) {
          window.location.href = result.url;
        }
        return;
      }
      toast.error(t(result.error));
    } catch {
      toast.error(t("somethingWentWrongPleaseTryAgain"));
    } finally {
      setBillingLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setBillingLoading(true);
    try {
      const result = await createPortalSession();
      if (result.success) {
        if (result.url != null) {
          window.location.href = result.url;
        }
        return;
      }
      toast.error(t(result.error));
    } catch {
      toast.error(t("somethingWentWrongPleaseTryAgain"));
    } finally {
      setBillingLoading(false);
    }
  };

  return (
    <div className="flex gap-8">
      <div className="min-w-0 flex-1 space-y-6">
        <div className="mb-4 flex justify-end xl:hidden">
          <PreviewToggle previewKey={previewKey} user={user} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboardTheme")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-2 text-sm font-medium">{t("darkTheme")}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {DARK_THEME_ID_LIST.map((id) => (
                  <ThemeSwatch
                    isSelected={preferredDark === id}
                    key={id}
                    name={THEMES[id].name}
                    onClick={() => setPreferredDark(id)}
                    swatch={THEMES[id].swatch}
                    variant="dashboard"
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-2 text-sm font-medium">{t("lightTheme")}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {LIGHT_THEME_ID_LIST.map((id) => (
                  <ThemeSwatch
                    isSelected={preferredLight === id}
                    key={id}
                    name={THEMES[id].name}
                    onClick={() => setPreferredLight(id)}
                    swatch={THEMES[id].swatch}
                    variant="dashboard"
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("pageTheme")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-muted-foreground mb-3 text-sm font-medium">{t("darkTheme")}</p>
              <ThemePicker
                action={updatePageDarkTheme}
                currentThemeId={pageDarkThemeId}
                onThemeChange={handlePageThemeChange}
                themeIds={DARK_THEME_ID_LIST}
              />
            </div>
            <div>
              <p className="text-muted-foreground mb-3 text-sm font-medium">{t("lightTheme")}</p>
              <ThemePicker
                action={updatePageLightTheme}
                currentThemeId={pageLightThemeId}
                onThemeChange={handlePageThemeChange}
                themeIds={LIGHT_THEME_ID_LIST}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("currentPlan")}</CardTitle>
            <CardDescription>
              {isPro ? (
                <span className="flex items-center gap-1.5">
                  <Check className="text-primary size-4" />
                  {t("pro")}
                </span>
              ) : (
                t("free")
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPro ? (
              <Button disabled={billingLoading} onClick={handleManageBilling} variant="secondary">
                {t("manageBilling")}
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  {t("upgradeToUnlockUnlimitedLinksCustomDomainsAndMore")}
                </p>
                <Button disabled={billingLoading} onClick={handleUpgrade}>
                  {t("upgradeToPro")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("branding")}</CardTitle>
            <CardDescription>{t("removeTheAnchrBrandingFromYourPublicPage")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isPro ? (
              <Button disabled={brandingPending} onClick={handleBrandingToggle} variant="tertiary">
                {brandingHidden ? t("showBranding") : t("hideBranding")}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Lock className="text-muted-foreground size-4" />
                <p className="text-muted-foreground text-sm">{t("upgradeToProToHideBranding")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <aside className="hidden w-72 shrink-0 xl:block">
        <div className="sticky top-6">
          <PagePreview previewKey={previewKey} user={user} />
        </div>
      </aside>
      <CheckoutCelebration onOpenChange={setCelebrationOpen} open={celebrationOpen} />
    </div>
  );
};
