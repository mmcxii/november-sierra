"use client";

import {
  addCustomDomain,
  checkUsernameAvailability,
  createPortalSession,
  disconnectNostrProfile,
  fetchNostrPreview,
  getOrCreateUserReferralCode,
  redeemReferralCode,
  removeAvatar,
  removeCustomDomain,
  saveNostrProfile,
  updateHideBranding,
  updateProfile,
  updateUsername,
  verifyCustomDomain,
} from "@/app/(dashboard)/dashboard/settings/actions";
import { CheckoutCelebration } from "@/components/dashboard/checkout-celebration";
import { PagePreview } from "@/components/dashboard/page-preview";
import { PreviewToggle } from "@/components/dashboard/preview-toggle";
import { DangerZone } from "@/components/dashboard/settings-content/danger-zone";
import { PasswordSection } from "@/components/dashboard/settings-content/password-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { SessionUser } from "@/lib/auth";
import type { TranslationKey } from "@/lib/i18n/i18next.d";
import { DEFAULT_RELAYS, type NostrProfileData } from "@/lib/nostr-profile";
import { usernameSchema } from "@/lib/schemas/username";
import { type ThemeId } from "@/lib/themes";
import { isProUser } from "@/lib/tier";
import { useUploadThing } from "@/lib/uploadthing";
import { useReverification, useSession, useUser } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import type { SessionVerificationResource } from "@clerk/shared/types";
import { Anchor, Camera, Check, CheckCircle2, Copy, Loader2, Lock, Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type SettingsContentProps = {
  checkoutSuccess?: boolean;
  email: string;
  hideBranding: boolean;
  pageDarkThemeId: ThemeId;
  pageLightThemeId: ThemeId;
  user: SessionUser;
};

export const SettingsContent: React.FC<SettingsContentProps> = (props) => {
  const { checkoutSuccess, email, hideBranding, pageDarkThemeId, pageLightThemeId, user } = props;

  const { t } = useTranslation();
  const { user: clerkUser } = useUser();
  const { session } = useSession();
  const [previewThemes] = React.useState({ dark: pageDarkThemeId, light: pageLightThemeId });
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
  // Nostr profile state
  const [useNostrProfile, setUseNostrProfile] = React.useState(user.useNostrProfile);
  const [npubInput, setNpubInput] = React.useState(user.nostrNpub ?? "");
  const [relayInputs, setRelayInputs] = React.useState<string[]>(
    user.nostrRelays != null ? (JSON.parse(user.nostrRelays) as string[]) : [...DEFAULT_RELAYS],
  );
  const [nostrPreview, setNostrPreview] = React.useState<null | NostrProfileData>(null);
  const [nostrFetching, setNostrFetching] = React.useState(false);
  const [nostrPending, startNostrTransition] = React.useTransition();
  const npubDebounceRef = React.useRef<null | ReturnType<typeof setTimeout>>(null);

  const isPro = isProUser(user);
  const previewKey = `${previewThemes.dark}|${previewThemes.light}|${brandingHidden}|${profileVersion}|${avatarUrl}`;

  // Username state
  const [usernameInput, setUsernameInput] = React.useState(user.username);
  const [usernameAvailability, setUsernameAvailability] = React.useState<"available" | "checking" | "idle" | "taken">(
    "idle",
  );
  const usernameDebounceRef = React.useRef<null | ReturnType<typeof setTimeout>>(null);
  const usernameHasValidationError = !usernameSchema.shape.username.safeParse(usernameInput).success;
  const usernameUnchanged = usernameInput === user.username;

  // Email state
  const [emailInput, setEmailInput] = React.useState("");
  const [emailStep, setEmailStep] = React.useState<"edit" | "reverify" | "verify">("edit");
  const [emailPending, setEmailPending] = React.useState(false);
  const [verificationCode, setVerificationCode] = React.useState("");
  const [currentEmail, setCurrentEmail] = React.useState(email);
  const emailAddressIdRef = React.useRef<null | string>(null);

  // Reverification state
  const [reverifyPassword, setReverifyPassword] = React.useState("");
  const [reverifyComplete, setReverifyComplete] = React.useState<null | (() => void)>(null);
  const [reverifyCancel, setReverifyCancel] = React.useState<null | (() => void)>(null);
  const reverificationRef = React.useRef<undefined | SessionVerificationResource>(undefined);

  const createEmailAddress = useReverification(
    async (emailValue: string) => clerkUser?.createEmailAddress({ email: emailValue }),
    {
      onNeedsReverification: ({ cancel, complete, level }) => {
        // Use function wrappers to prevent React from invoking these as state initializers
        setReverifyComplete(() => complete);
        setReverifyCancel(() => cancel);
        setEmailPending(false);
        setEmailStep("reverify");

        // Start the verification session
        void session?.startVerification({ level: level ?? "first_factor" }).then(async (response) => {
          reverificationRef.current = response;
          await prepareReverification(response);
        });
      },
    },
  );

  React.useEffect(() => {
    if (checkoutSuccess) {
      window.history.replaceState(null, "", "/dashboard/settings");
    }
  }, [checkoutSuccess]);

  React.useEffect(() => {
    void getOrCreateUserReferralCode().then((result) => {
      if (result.success) {
        setUserReferralCode(result.code);
      }
    });
  }, []);

  // Username availability check
  React.useEffect(() => {
    if (usernameDebounceRef.current != null) {
      clearTimeout(usernameDebounceRef.current);
    }

    if (usernameHasValidationError || usernameUnchanged || usernameInput.length < 1) {
      setUsernameAvailability("idle");
      return;
    }

    setUsernameAvailability("checking");

    usernameDebounceRef.current = setTimeout(async () => {
      const result = await checkUsernameAvailability(usernameInput);
      setUsernameAvailability(result.available ? "available" : "taken");
    }, 400);

    return () => {
      if (usernameDebounceRef.current != null) {
        clearTimeout(usernameDebounceRef.current);
      }
    };
  }, [usernameInput, usernameHasValidationError, usernameUnchanged]);

  // Nostr npub auto-fetch
  React.useEffect(() => {
    if (npubDebounceRef.current != null) {
      clearTimeout(npubDebounceRef.current);
    }

    if (!useNostrProfile || npubInput.trim().length === 0) {
      setNostrPreview(null);
      return;
    }

    npubDebounceRef.current = setTimeout(async () => {
      setNostrFetching(true);
      const result = await fetchNostrPreview(npubInput.trim(), relayInputs);
      setNostrFetching(false);

      if (result.success) {
        setNostrPreview(result.data);
        setDisplayNameInput(result.data.displayName ?? "");
        setBioInput(result.data.about ?? "");
        if (result.data.picture != null) {
          setAvatarUrl(result.data.picture);
        }
      } else {
        setNostrPreview(null);
        toast.error(t(result.error as TranslationKey));
      }
    }, 600);

    return () => {
      if (npubDebounceRef.current != null) {
        clearTimeout(npubDebounceRef.current);
      }
    };
  }, [npubInput, useNostrProfile]); // eslint-disable-line react-hooks/exhaustive-deps -- only re-fetch on npub/toggle change

  // NOTE: OTP auto-submit effects are below — they reference handleEmailVerify and handleReverifySubmit
  // which are declared in the Handlers section. We use a ref-based approach to avoid circular deps.
  const handleEmailVerifyRef = React.useRef<undefined | (() => Promise<void>)>(undefined);
  const handleReverifySubmitRef = React.useRef<undefined | (() => Promise<void>)>(undefined);

  React.useEffect(() => {
    if (/^\d{6}$/.test(verificationCode) && !emailPending) {
      void handleEmailVerifyRef.current?.();
    }
  }, [verificationCode, emailPending]);

  React.useEffect(() => {
    const hasPassword = reverificationRef.current?.supportedFirstFactors?.some((f) => f.strategy === "password");
    if (!hasPassword && /^\d{6}$/.test(reverifyPassword) && !emailPending) {
      void handleReverifySubmitRef.current?.();
    }
  }, [reverifyPassword, emailPending]);

  //* Handlers
  const handleBrandingToggle = () => {
    const newValue = !brandingHidden;
    setBrandingHidden(newValue);

    startBrandingTransition(async () => {
      const result = await updateHideBranding(newValue);

      if (!result.success) {
        setBrandingHidden(!newValue);
        toast.error(t(result.error as TranslationKey));
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
        toast.error(t(result.error as TranslationKey));
        return;
      }

      setAvatarUrl(null);
      setProfileVersion((v) => v + 1);
    });
  };

  const handleProfileSave = () => {
    // If Nostr profile is active and we have preview data, use the Nostr save flow
    if (useNostrProfile && nostrPreview != null) {
      handleNostrSave();
      return;
    }

    startProfileTransition(async () => {
      // Save username if changed
      if (!usernameUnchanged && usernameAvailability === "available" && !usernameHasValidationError) {
        const usernameResult = await updateUsername(usernameInput);

        if (!usernameResult.success) {
          toast.error(t(usernameResult.error as TranslationKey));
          return;
        }
      }

      const result = await updateProfile(displayNameInput, bioInput);

      if (!result.success) {
        toast.error(t(result.error as TranslationKey));
        return;
      }

      setProfileVersion((v) => v + 1);

      // Start email change flow if email changed — must run after profile save
      // so the verification UI isn't masked by the "profile updated" toast
      if (emailInput.trim().length > 0) {
        await handleEmailUpdate();
        return;
      }

      toast.success(t("profileUpdated"));
    });
  };

  const handleNostrToggle = (checked: boolean) => {
    setUseNostrProfile(checked);

    if (!checked && user.useNostrProfile) {
      // Was previously connected — don't clear state yet, show disconnect button
      return;
    }

    if (!checked) {
      setNostrPreview(null);
    }
  };

  const handleDisconnectNostr = () => {
    startNostrTransition(async () => {
      const result = await disconnectNostrProfile();

      if (!result.success) {
        toast.error(t(result.error as TranslationKey));
        return;
      }

      setUseNostrProfile(false);
      setNpubInput("");
      setRelayInputs([...DEFAULT_RELAYS]);
      setNostrPreview(null);
      toast.success(t("nostrProfileDisconnected"));
    });
  };

  const handleNostrSave = () => {
    startNostrTransition(async () => {
      if (nostrPreview == null) {
        return;
      }

      const result = await saveNostrProfile(npubInput.trim(), relayInputs, nostrPreview);

      if (!result.success) {
        toast.error(t(result.error as TranslationKey));
        return;
      }

      setProfileVersion((v) => v + 1);
      toast.success(t("nostrProfileConnected"));
    });
  };

  const handleNpubInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setNpubInput(e.target.value);

  const handleRelayChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setRelayInputs((prev) => {
      // Prevent duplicate relay URLs (ignore empty strings while typing)
      if (newValue.length > 0 && prev.some((r, i) => i !== index && r === newValue)) {
        return prev;
      }

      return prev.map((r, i) => (i === index ? newValue : r));
    });
  };

  const handleAddRelay = () => {
    if (relayInputs.length < 5 && !relayInputs.includes("")) {
      setRelayInputs((prev) => [...prev, ""]);
    }
  };

  const handleRemoveRelay = (index: number) => () => {
    setRelayInputs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDisplayNameOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setDisplayNameInput(e.target.value);
  const handleBioOnChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setBioInput(e.target.value);

  const handleUsernameOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setUsernameInput(e.target.value);

  const handleEmailInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setEmailInput(e.target.value);
  const handleVerificationOtpOnChange = (value: string) => setVerificationCode(value);
  const handleReverifyOtpOnChange = (value: string) => setReverifyPassword(value);

  const handleEmailUpdate = async () => {
    if (clerkUser == null) {
      return;
    }

    setEmailPending(true);

    try {
      const emailAddress = await createEmailAddress(emailInput);

      if (emailAddress == null) {
        return;
      }

      emailAddressIdRef.current = emailAddress.id;

      // Reload user so the new email address appears in clerkUser.emailAddresses
      await clerkUser.reload();

      // Find the newly created email address and send verification code
      const newEmail = clerkUser.emailAddresses.find((e) => e.id === emailAddress.id);
      await newEmail?.prepareVerification({ strategy: "email_code" });

      setEmailStep("verify");
      toast.success(t("checkYourEmail"));
    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        toast.error(error.errors[0]?.longMessage ?? t("somethingWentWrongPleaseTryAgain"));
      } else {
        toast.error(t("somethingWentWrongPleaseTryAgain"));
      }
    } finally {
      setEmailPending(false);
    }
  };

  const handleEmailVerify = React.useCallback(async () => {
    if (clerkUser == null || emailAddressIdRef.current == null) {
      return;
    }

    setEmailPending(true);

    try {
      const emailAddress = clerkUser.emailAddresses.find((e) => e.id === emailAddressIdRef.current);

      if (emailAddress == null) {
        toast.error(t("somethingWentWrongPleaseTryAgain"));
        return;
      }

      const result = await emailAddress.attemptVerification({ code: verificationCode });

      if (result.verification.status !== "verified") {
        toast.error(t("somethingWentWrongPleaseTryAgain"));
        return;
      }

      await clerkUser.update({ primaryEmailAddressId: result.id });

      // Remove the old email address
      const oldEmail = clerkUser.emailAddresses.find((e) => e.id !== result.id);
      if (oldEmail != null) {
        await oldEmail.destroy();
      }

      setCurrentEmail(emailInput);
      setEmailInput("");
      setVerificationCode("");
      setEmailStep("edit");
      emailAddressIdRef.current = null;
      toast.success(t("emailUpdated"));
    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        toast.error(error.errors[0]?.longMessage ?? t("somethingWentWrongPleaseTryAgain"));
      } else {
        toast.error(t("somethingWentWrongPleaseTryAgain"));
      }
      setVerificationCode("");
    } finally {
      setEmailPending(false);
    }
  }, [clerkUser, emailInput, t, verificationCode]);

  const handleEmailCancel = () => {
    if (emailStep === "reverify") {
      reverifyCancel?.();
      setReverifyComplete(null);
      setReverifyCancel(null);
      setReverifyPassword("");
      reverificationRef.current = undefined;
    }

    setEmailStep("edit");
    setEmailInput("");
    setVerificationCode("");
    emailAddressIdRef.current = null;
  };

  const prepareReverification = async (verification: SessionVerificationResource) => {
    if (verification.status !== "needs_first_factor") {
      return;
    }

    const passwordFactor = verification.supportedFirstFactors?.find((f) => f.strategy === "password");
    const emailCodeFactor = verification.supportedFirstFactors?.find((f) => f.strategy === "email_code");

    if (passwordFactor != null) {
      // Password-based reverification — just show the password input, no prep needed
      return;
    }

    if (emailCodeFactor != null && "emailAddressId" in emailCodeFactor) {
      await session?.prepareFirstFactorVerification({
        emailAddressId: emailCodeFactor.emailAddressId,
        strategy: "email_code",
      });
    }
  };

  const handleReverifyPasswordOnChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setReverifyPassword(e.target.value);

  const handleReverifySubmit = React.useCallback(async () => {
    setEmailPending(true);

    try {
      const verification = reverificationRef.current;
      const hasPassword = verification?.supportedFirstFactors?.some((f) => f.strategy === "password");

      if (hasPassword) {
        await session?.attemptFirstFactorVerification({ password: reverifyPassword, strategy: "password" });
      } else {
        await session?.attemptFirstFactorVerification({ code: reverifyPassword, strategy: "email_code" });
      }

      reverifyComplete?.();
      setReverifyComplete(null);
      setReverifyCancel(null);
      setReverifyPassword("");
      reverificationRef.current = undefined;
    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        toast.error(error.errors[0]?.longMessage ?? t("somethingWentWrongPleaseTryAgain"));
      } else {
        toast.error(t("somethingWentWrongPleaseTryAgain"));
      }
      setReverifyPassword("");
    } finally {
      setEmailPending(false);
    }
  }, [reverifyComplete, reverifyPassword, session, t]);

  // Keep refs in sync so the effects above can call latest versions
  handleEmailVerifyRef.current = handleEmailVerify;
  handleReverifySubmitRef.current = handleReverifySubmit;

  // TODO: ANC-107 — restore handleUpgrade once Stripe product is created

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
      toast.error(t(result.error as TranslationKey));
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
        toast.error(t(result.error as TranslationKey));
        return;
      }
      setDomainInput("");
    });
  };

  const handleVerifyDomain = () => {
    startDomainTransition(async () => {
      const result = await verifyCustomDomain();
      if (!result.success) {
        toast.error(t(result.error as TranslationKey));
        return;
      }
      toast.success(t("domainConnected"));
    });
  };

  const handleRemoveDomain = () => {
    startDomainTransition(async () => {
      const result = await removeCustomDomain();
      if (!result.success) {
        toast.error(t(result.error as TranslationKey));
        return;
      }
      toast.success(t("domainRemoved"));
    });
  };

  const handleDomainInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setDomainInput(e.target.value);

  const handleReferralInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setReferralInput(e.target.value);

  const handleRedeemCode = () => {
    startReferralTransition(async () => {
      const result = await redeemReferralCode(referralInput);
      if (!result.success) {
        toast.error(t(result.error as TranslationKey));
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
            <CardTitle>{t("account")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-2 text-sm font-medium">{t("username")}</p>
              <div className="relative">
                <Input
                  disabled={profilePending}
                  onChange={handleUsernameOnChange}
                  placeholder="your_username"
                  value={usernameInput}
                />
                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                  {usernameAvailability === "checking" && (
                    <Loader2 className="text-muted-foreground size-4 animate-spin" />
                  )}
                  {usernameAvailability === "available" && <Check className="size-4 text-emerald-500" />}
                  {usernameAvailability === "taken" && <X className="size-4 text-red-500" />}
                </div>
              </div>
              {usernameAvailability === "taken" && !usernameHasValidationError && (
                <p className="text-destructive mt-1 text-xs">{t("thisUsernameIsAlreadyTaken")}</p>
              )}
              {usernameAvailability === "available" && !usernameHasValidationError && (
                <p className="mt-1 text-xs text-emerald-500">{t("usernameIsAvailable")}</p>
              )}
              {/* eslint-disable-next-line anchr/no-raw-string-jsx -- brand URL prefix with dynamic username */}
              <p className="text-muted-foreground mt-1 text-xs">anchr.to/{usernameInput}</p>
            </div>

            <div>
              <p className="text-muted-foreground mb-2 text-sm font-medium">{t("email")}</p>
              {emailStep === "edit" && (
                <Input
                  disabled={profilePending || emailPending}
                  onChange={handleEmailInputOnChange}
                  placeholder={currentEmail}
                  type="email"
                  value={emailInput}
                />
              )}
              {emailStep === "reverify" && (
                <div className="space-y-2">
                  {reverificationRef.current?.supportedFirstFactors?.some((f) => f.strategy === "password") ? (
                    <>
                      <p className="text-muted-foreground text-xs">{t("confirmYourPasswordToContinue")}</p>
                      <div className="flex gap-2">
                        <Input
                          disabled={emailPending}
                          onChange={handleReverifyPasswordOnChange}
                          placeholder={t("password")}
                          type="password"
                          value={reverifyPassword}
                        />
                        <Button
                          disabled={emailPending || reverifyPassword.length === 0}
                          onClick={handleReverifySubmit}
                          variant="secondary"
                        >
                          {emailPending && <Loader2 className="size-3.5 animate-spin" />}
                          {t("continue")}
                        </Button>
                        <Button disabled={emailPending} onClick={handleEmailCancel} variant="tertiary">
                          {t("cancel")}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-muted-foreground text-xs">{t("enterTheCodeWeSentToYourEmail")}</p>
                      <div className="flex items-center gap-2">
                        <InputOTP
                          disabled={emailPending}
                          maxLength={6}
                          onChange={handleReverifyOtpOnChange}
                          value={reverifyPassword}
                        >
                          <InputOTPGroup>
                            {[0, 1, 2].map((i) => (
                              <InputOTPSlot index={i} key={i} />
                            ))}
                          </InputOTPGroup>
                          <InputOTPSeparator />
                          <InputOTPGroup>
                            {[3, 4, 5].map((i) => (
                              <InputOTPSlot index={i} key={i} />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                        {emailPending && <Loader2 className="size-3.5 animate-spin" />}
                        <Button disabled={emailPending} onClick={handleEmailCancel} variant="tertiary">
                          {t("cancel")}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {emailStep === "verify" && (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs">{t("enterTheCodeWeSentToYourEmail")}</p>
                  <div className="flex items-center gap-2">
                    <InputOTP
                      disabled={emailPending}
                      maxLength={6}
                      onChange={handleVerificationOtpOnChange}
                      value={verificationCode}
                    >
                      <InputOTPGroup>
                        {[0, 1, 2].map((i) => (
                          <InputOTPSlot index={i} key={i} />
                        ))}
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        {[3, 4, 5].map((i) => (
                          <InputOTPSlot index={i} key={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                    {emailPending && <Loader2 className="size-3.5 animate-spin" />}
                    <Button disabled={emailPending} onClick={handleEmailCancel} variant="tertiary">
                      {t("cancel")}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <hr className="border-border" />

            <div>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-muted-foreground text-sm font-medium">{t("avatar")}</p>
                {useNostrProfile && <Lock className="text-muted-foreground size-3" />}
              </div>
              <div className="flex items-center gap-4">
                <button
                  className="border-border bg-muted group relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border"
                  disabled={isUploading || useNostrProfile}
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
                  {!useNostrProfile && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      {isUploading ? (
                        <Loader2 className="size-5 animate-spin text-white" />
                      ) : (
                        <Camera className="size-5 text-white" />
                      )}
                    </div>
                  )}
                </button>
                <input
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  ref={fileInputRef}
                  type="file"
                />
                {avatarUrl != null && !useNostrProfile && (
                  <Button disabled={avatarPending} onClick={handleRemoveAvatar} variant="tertiary">
                    {t("removeAvatar")}
                  </Button>
                )}
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-muted-foreground text-sm font-medium">{t("displayName")}</p>
                {useNostrProfile && <Lock className="text-muted-foreground size-3" />}
              </div>
              <Input
                disabled={profilePending || useNostrProfile}
                onChange={handleDisplayNameOnChange}
                placeholder={user.username}
                value={displayNameInput}
              />
              {useNostrProfile && <p className="text-muted-foreground mt-1 text-xs">{t("managedByNostrProfile")}</p>}
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-muted-foreground text-sm font-medium">{t("bio")}</p>
                {useNostrProfile && <Lock className="text-muted-foreground size-3" />}
              </div>
              <Textarea disabled={profilePending || useNostrProfile} onChange={handleBioOnChange} value={bioInput} />
              {useNostrProfile && <p className="text-muted-foreground mt-1 text-xs">{t("managedByNostrProfile")}</p>}
            </div>

            <hr className="border-border" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("nostrProfile")}</p>
                  <p className="text-muted-foreground text-xs">{t("useNostrProfile")}</p>
                </div>
                <Switch checked={useNostrProfile} disabled={nostrPending} onCheckedChange={handleNostrToggle} />
              </div>

              {useNostrProfile && (
                <div className="space-y-4">
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm font-medium">{t("npub")}</p>
                    <div className="relative">
                      <Input
                        disabled={nostrPending}
                        onChange={handleNpubInputOnChange}
                        placeholder="npub1..."
                        value={npubInput}
                      />
                      {nostrFetching && (
                        <div className="absolute top-1/2 right-3 -translate-y-1/2">
                          <Loader2 className="text-muted-foreground size-4 animate-spin" />
                        </div>
                      )}
                    </div>
                    {nostrFetching && <p className="text-muted-foreground mt-1 text-xs">{t("fetchingNostrProfile")}</p>}
                  </div>

                  <div>
                    <p className="text-muted-foreground mb-2 text-sm font-medium">{t("relays")}</p>
                    <div className="space-y-2">
                      {relayInputs.map((relay, index) => (
                        <div className="flex gap-2" key={relay}>
                          <Input
                            disabled={nostrPending}
                            onChange={handleRelayChange(index)}
                            placeholder="wss://..."
                            value={relay}
                          />
                          {relayInputs.length > 1 && (
                            <IconButton
                              aria-label={t("removeRelay")}
                              disabled={nostrPending}
                              onClick={handleRemoveRelay(index)}
                            >
                              <Minus className="size-4" />
                            </IconButton>
                          )}
                        </div>
                      ))}
                      {relayInputs.length < 5 && (
                        <Button disabled={nostrPending} onClick={handleAddRelay} variant="tertiary">
                          <Plus className="size-3.5" />
                          {t("addRelay")}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!useNostrProfile && user.useNostrProfile && (
                <Button disabled={nostrPending} onClick={handleDisconnectNostr} variant="tertiary">
                  {nostrPending && <Loader2 className="size-3.5 animate-spin" />}
                  {t("disconnectNostrProfile")}
                </Button>
              )}
            </div>

            {emailStep === "edit" && (
              <Button
                disabled={
                  profilePending ||
                  nostrPending ||
                  nostrFetching ||
                  (!usernameUnchanged && usernameAvailability !== "available") ||
                  (useNostrProfile && nostrPreview == null)
                }
                onClick={handleProfileSave}
                variant="secondary"
              >
                {(profilePending || nostrPending) && <Loader2 className="size-3.5 animate-spin" />}
                {t("save")}
              </Button>
            )}
          </CardContent>
        </Card>

        <PasswordSection />

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
                {/* TODO: ANC-107 — re-enable once Stripe product is created */}
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
            {!isPro && (
              <div className="flex items-center gap-2">
                <Lock className="text-muted-foreground size-4" />
                <p className="text-muted-foreground text-sm">{t("upgradeToProToUseACustomDomain")}</p>
              </div>
            )}
            {isPro && user.customDomain == null && (
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
            )}
            {isPro && user.customDomain != null && !user.customDomainVerified && (
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
            )}
            {isPro && user.customDomain != null && user.customDomainVerified && (
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

        <DangerZone username={user.username} />
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
