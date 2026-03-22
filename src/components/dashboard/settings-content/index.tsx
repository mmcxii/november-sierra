"use client";

import {
  addCustomDomain,
  createCheckoutSession,
  createPortalSession,
  getOrCreateUserReferralCode,
  redeemReferralCode,
  removeAvatar,
  removeCustomDomain,
  updateHideBranding,
  updatePageDarkTheme,
  updatePageLightTheme,
  updateProfile,
  verifyCustomDomain,
} from "@/app/(dashboard)/dashboard/settings/actions";
import { CheckoutCelebration } from "@/components/dashboard/checkout-celebration";
import { PagePreview } from "@/components/dashboard/page-preview";
import { PreviewToggle } from "@/components/dashboard/preview-toggle";
import { ThemePicker } from "@/components/dashboard/theme-picker";
import { useDashboardTheme } from "@/components/dashboard/theme-provider/context";
import { ThemeSwatch } from "@/components/dashboard/theme-swatch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SessionUser } from "@/lib/auth";
import { DARK_THEME_ID_LIST, LIGHT_THEME_ID_LIST, THEMES, isDarkTheme, type ThemeId } from "@/lib/themes";
import { isProUser } from "@/lib/tier";
import { useUploadThing } from "@/lib/uploadthing";
import { Anchor, Camera, Check, CheckCircle2, Copy, Loader2, Lock } from "lucide-react";
import Image from "next/image";
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
  const [displayNameInput, setDisplayNameInput] = React.useState(user.displayName ?? "");
  const [bioInput, setBioInput] = React.useState(user.bio ?? "");
  const [profilePending, startProfileTransition] = React.useTransition();
  const [profileVersion, setProfileVersion] = React.useState(0);
  const [avatarUrl, setAvatarUrl] = React.useState(user.avatarUrl);
  const [avatarPending, startAvatarTransition] = React.useTransition();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { isUploading, startUpload } = useUploadThing("avatarUploader");
  const [domainInput, setDomainInput] = React.useState("");
  const [domainPending, startDomainTransition] = React.useTransition();
  const [referralInput, setReferralInput] = React.useState("");
  const [referralPending, startReferralTransition] = React.useTransition();
  const [userReferralCode, setUserReferralCode] = React.useState<null | string>(null);
  const isPro = isProUser(user);
  const previewKey = `${previewThemes.dark}|${previewThemes.light}|${brandingHidden}|${profileVersion}|${avatarUrl}`;

  React.useEffect(() => {
    if (checkoutSuccess) {
      window.history.replaceState(null, "", "/dashboard/settings");
    }
  }, [checkoutSuccess]);

  React.useEffect(() => {
    getOrCreateUserReferralCode().then((result) => {
      if (result.success) {
        setUserReferralCode(result.code);
      }
    });
  }, []);

  //* Handlers
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

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file == null) {
      return;
    }

    const result = await startUpload([file]);
    if (result?.[0]?.serverData?.avatarUrl != null) {
      setAvatarUrl(result[0].serverData.avatarUrl);
      setProfileVersion((v) => v + 1);
      toast.success(t("avatarUpdated"));
    }

    // Reset input so re-selecting the same file works
    e.target.value = "";
  };

  const handleRemoveAvatar = () => {
    startAvatarTransition(async () => {
      const result = await removeAvatar();

      if (!result.success) {
        toast.error(t(result.error));
        return;
      }

      setAvatarUrl(null);
      setProfileVersion((v) => v + 1);
    });
  };

  const handleProfileSave = () => {
    startProfileTransition(async () => {
      const result = await updateProfile(displayNameInput, bioInput);

      if (!result.success) {
        toast.error(t(result.error));
        return;
      }

      setProfileVersion((v) => v + 1);
      toast.success(t("profileUpdated"));
    });
  };

  const handleDisplayNameOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setDisplayNameInput(e.target.value);
  const handleBioOnChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setBioInput(e.target.value);

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

  const handleAddDomain = () => {
    startDomainTransition(async () => {
      const result = await addCustomDomain(domainInput);
      if (!result.success) {
        toast.error(t(result.error));
        return;
      }
      setDomainInput("");
    });
  };

  const handleVerifyDomain = () => {
    startDomainTransition(async () => {
      const result = await verifyCustomDomain();
      if (!result.success) {
        toast.error(t(result.error));
        return;
      }
      toast.success(t("domainConnected"));
    });
  };

  const handleRemoveDomain = () => {
    startDomainTransition(async () => {
      const result = await removeCustomDomain();
      if (!result.success) {
        toast.error(t(result.error));
        return;
      }
      toast.success(t("domainRemoved"));
    });
  };

  const handleDomainInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setDomainInput(e.target.value);

  const handleDarkThemeSwatchOnClick = React.useCallback(
    (id: ThemeId) => () => setPreferredDark(id),
    [setPreferredDark],
  );

  const handleLightThemeSwatchOnClick = React.useCallback(
    (id: ThemeId) => () => setPreferredLight(id),
    [setPreferredLight],
  );

  const handleReferralInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setReferralInput(e.target.value);

  const handleRedeemCode = () => {
    startReferralTransition(async () => {
      const result = await redeemReferralCode(referralInput);
      if (!result.success) {
        toast.error(t(result.error));
        return;
      }
      setReferralInput("");
      toast.success(t("referralCodeRedeemed"));
    });
  };

  const handleCopyReferralCode = async () => {
    if (userReferralCode == null) {
      return;
    }
    await navigator.clipboard.writeText(userReferralCode);
    toast.success(t("referralCodeCopied"));
  };

  return (
    <div className="flex gap-8">
      <div className="min-w-0 flex-1 space-y-6">
        <div className="mb-4 flex justify-end xl:hidden">
          <PreviewToggle previewKey={previewKey} user={user} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("profile")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-2 text-sm font-medium">{t("avatar")}</p>
              <div className="flex items-center gap-4">
                <button
                  className="border-border bg-muted group relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border"
                  disabled={isUploading}
                  onClick={handleAvatarClick}
                  title={t("clickToUpload")}
                  type="button"
                >
                  {avatarUrl != null ? (
                    <Image
                      alt={user.displayName ?? user.username}
                      className="size-16 rounded-full object-cover"
                      height={64}
                      src={avatarUrl}
                      width={64}
                    />
                  ) : (
                    <Anchor className="text-muted-foreground size-7" strokeWidth={1.25} />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    {isUploading ? (
                      <Loader2 className="size-5 animate-spin text-white" />
                    ) : (
                      <Camera className="size-5 text-white" />
                    )}
                  </div>
                </button>
                <input
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  ref={fileInputRef}
                  type="file"
                />
                {avatarUrl != null && (
                  <Button disabled={avatarPending} onClick={handleRemoveAvatar} variant="tertiary">
                    {t("removeAvatar")}
                  </Button>
                )}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-2 text-sm font-medium">{t("displayName")}</p>
              <Input
                disabled={profilePending}
                onChange={handleDisplayNameOnChange}
                placeholder={user.username}
                value={displayNameInput}
              />
            </div>
            <div>
              <p className="text-muted-foreground mb-2 text-sm font-medium">{t("bio")}</p>
              <Textarea disabled={profilePending} onChange={handleBioOnChange} value={bioInput} />
            </div>
            <Button disabled={profilePending} onClick={handleProfileSave} variant="secondary">
              {profilePending && <Loader2 className="size-3.5 animate-spin" />}
              {t("save")}
            </Button>
          </CardContent>
        </Card>

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
                    onClick={handleDarkThemeSwatchOnClick(id)}
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
                    onClick={handleLightThemeSwatchOnClick(id)}
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
          <CardContent className="space-y-6">
            {isPro ? (
              <div className="space-y-3">
                {user.proExpiresAt != null && user.proExpiresAt > new Date() && (
                  <p className="text-muted-foreground text-sm">
                    {t("proAccessExpiresOn{{date}}", { date: user.proExpiresAt.toLocaleDateString() })}
                  </p>
                )}
                <Button disabled={billingLoading} onClick={handleManageBilling} variant="secondary">
                  {t("manageBilling")}
                </Button>
              </div>
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

            <hr className="border-border" />

            <div className="space-y-2">
              <p className="text-sm font-medium">{t("referFriends")}</p>
              <p className="text-muted-foreground text-sm">
                {t("shareYourReferralCodeNewUsersGet1FreeMonthOfProWhenTheyGoProYouGetAFreeMonthToo")}
              </p>
              {userReferralCode != null ? (
                <div className="flex items-center gap-2 pt-1">
                  <code className="bg-muted rounded-md border px-3 py-2 font-mono text-sm">{userReferralCode}</code>
                  <IconButton onClick={handleCopyReferralCode}>
                    <Copy className="size-4" />
                  </IconButton>
                </div>
              ) : (
                <Loader2 className="text-muted-foreground size-4 animate-spin" />
              )}
            </div>

            <hr className="border-border" />

            <div className="space-y-2">
              <p className="text-sm font-medium">{t("redeemAReferralCode")}</p>
              <div className="flex gap-2">
                <Input
                  disabled={referralPending}
                  onChange={handleReferralInputOnChange}
                  placeholder="ANCHR-XXXXXX"
                  value={referralInput}
                />
                <Button
                  disabled={referralPending || referralInput.trim().length === 0}
                  onClick={handleRedeemCode}
                  variant="secondary"
                >
                  {referralPending && <Loader2 className="size-3.5 animate-spin" />}
                  {t("redeem")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("customDomain")}</CardTitle>
            <CardDescription>{t("useYourOwnDomainForYourAnchrPage")}</CardDescription>
          </CardHeader>
          <CardContent>
            {!isPro ? (
              <div className="flex items-center gap-2">
                <Lock className="text-muted-foreground size-4" />
                <p className="text-muted-foreground text-sm">{t("upgradeToProToUseACustomDomain")}</p>
              </div>
            ) : user.customDomain == null ? (
              <div className="flex gap-2">
                <Input
                  disabled={domainPending}
                  onChange={handleDomainInputOnChange}
                  placeholder="yourdomain.com"
                  value={domainInput}
                />
                <Button
                  disabled={domainPending || domainInput.trim().length === 0}
                  onClick={handleAddDomain}
                  variant="secondary"
                >
                  {domainPending && <Loader2 className="size-3.5 animate-spin" />}
                  {t("addDomain")}
                </Button>
              </div>
            ) : !user.customDomainVerified ? (
              <div className="space-y-4">
                <p className="text-foreground text-sm font-medium">{user.customDomain}</p>
                <div>
                  <p className="text-muted-foreground mb-2 text-sm">{t("addThisCnameRecordToYourDnsProvider")}</p>
                  <div className="bg-muted rounded-md border p-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted-foreground">
                          {/* eslint-disable-next-line anchr/no-raw-string-jsx -- standard DNS table headers */}
                          <th className="pb-1 text-left font-medium">Type</th>
                          {/* eslint-disable-next-line anchr/no-raw-string-jsx -- standard DNS table headers */}
                          <th className="pb-1 text-left font-medium">Name</th>
                          {/* eslint-disable-next-line anchr/no-raw-string-jsx -- standard DNS table headers */}
                          <th className="pb-1 text-left font-medium">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-foreground">
                          {/* eslint-disable-next-line anchr/no-raw-string-jsx -- DNS record type */}
                          <td className="font-mono">CNAME</td>
                          {/* eslint-disable-next-line anchr/no-raw-string-jsx -- DNS wildcard */}
                          <td className="font-mono">@</td>
                          {/* eslint-disable-next-line anchr/no-raw-string-jsx -- Vercel CNAME target */}
                          <td className="font-mono">cname.vercel-dns.com</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button disabled={domainPending} onClick={handleVerifyDomain}>
                    {domainPending && <Loader2 className="size-3.5 animate-spin" />}
                    {t("verifyDns")}
                  </Button>
                  <Button disabled={domainPending} onClick={handleRemoveDomain} variant="tertiary">
                    {t("removeDomain")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-primary size-4" />
                  <p className="text-foreground text-sm font-medium">{user.customDomain}</p>
                </div>
                <p className="text-muted-foreground text-sm">
                  {t("yourPageIsLiveAt{{url}}", {
                    interpolation: { escapeValue: false },
                    url: `https://${user.customDomain}`,
                  })}
                </p>
                <Button disabled={domainPending} onClick={handleRemoveDomain} variant="tertiary">
                  {t("removeDomain")}
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
