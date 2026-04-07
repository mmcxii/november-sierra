"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useSession, useUser } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type Step = "email-fallback" | "form";

export const PasswordSection: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const { session } = useSession();

  const [step, setStep] = React.useState<Step>("form");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<null | string>(null);

  const resetState = () => {
    setStep("form");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setCode("");
    setError(null);
  };

  const validatePasswords = (): boolean => {
    if (newPassword.length < 8) {
      setError(t("passwordMustBeAtLeast8Characters"));
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      return false;
    }

    return true;
  };

  const handlePasswordUpdate = async () => {
    if (user == null || !validatePasswords()) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      await user.updatePassword({ currentPassword, newPassword });
      toast.success(t("passwordUpdated"));
      resetState();
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        const clerkError = err.errors[0];
        // Clerk's documented error code is "form_password_incorrect", but in practice
        // some Clerk versions return a different code with the same message text.
        // Fall back to message matching to handle both cases.
        const isIncorrectPassword =
          clerkError?.code === "form_password_incorrect" ||
          clerkError?.message?.toLowerCase().includes("incorrect password") ||
          clerkError?.longMessage?.toLowerCase().includes("incorrect password");
        if (isIncorrectPassword) {
          setError(t("incorrectPasswordYouCanVerifyViaEmailInstead"));
        } else {
          setError(clerkError?.longMessage ?? clerkError?.message ?? t("somethingWentWrongPleaseTryAgain"));
        }
      } else {
        setError(t("somethingWentWrongPleaseTryAgain"));
      }
    } finally {
      setPending(false);
    }
  };

  const handleStartEmailFallback = async () => {
    if (session == null) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      // Start session verification to prove identity via email code
      const verification = await session.startVerification({ level: "first_factor" });

      // Find the email code factor and prepare it (sends the code)
      const emailCodeFactor = verification.supportedFirstFactors?.find((f) => f.strategy === "email_code");

      if (emailCodeFactor != null && "emailAddressId" in emailCodeFactor) {
        await session.prepareFirstFactorVerification({
          emailAddressId: emailCodeFactor.emailAddressId,
          strategy: "email_code",
        });
      }

      setStep("email-fallback");
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setError(err.errors[0]?.longMessage ?? t("somethingWentWrongPleaseTryAgain"));
      } else {
        setError(t("somethingWentWrongPleaseTryAgain"));
      }
    } finally {
      setPending(false);
    }
  };

  const handleEmailFallbackSubmit = React.useCallback(async () => {
    if (user == null || session == null || !validatePasswords()) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      // Verify the session with the email code
      await session.attemptFirstFactorVerification({ code, strategy: "email_code" });

      // Session is now reverified — update password without currentPassword
      await user.updatePassword({ newPassword });
      toast.success(t("passwordUpdated"));
      resetState();
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setError(err.errors[0]?.longMessage ?? t("somethingWentWrongPleaseTryAgain"));
      } else {
        setError(t("somethingWentWrongPleaseTryAgain"));
      }
      setCode("");
    } finally {
      setPending(false);
    }
  }, [code, confirmPassword, newPassword, session, t, user]);

  const handleOtpOnChange = (value: string) => {
    setCode(value);
  };

  React.useEffect(() => {
    if (
      /^\d{6}$/.test(code) &&
      !pending &&
      step === "email-fallback" &&
      newPassword.length >= 8 &&
      newPassword === confirmPassword
    ) {
      void handleEmailFallbackSubmit();
    }
  }, [code, pending, step, newPassword, confirmPassword, handleEmailFallbackSubmit]);

  const handleCurrentPasswordOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value);
  const handleNewPasswordOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value);
  const handleConfirmPasswordOnChange = (e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value);

  const showEmailFallbackLink =
    error != null && step === "form" && error === t("incorrectPasswordYouCanVerifyViaEmailInstead");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("password")}</CardTitle>
        <CardDescription>{t("updateYourPassword")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "form" && (
          <>
            <div>
              <Label className="text-muted-foreground mb-2 block text-sm font-medium" htmlFor="currentPassword">
                {t("currentPassword")}
              </Label>
              <Input
                autoComplete="current-password"
                disabled={pending}
                id="currentPassword"
                onChange={handleCurrentPasswordOnChange}
                type="password"
                value={currentPassword}
              />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block text-sm font-medium" htmlFor="settingsNewPassword">
                {t("newPassword")}
              </Label>
              <Input
                autoComplete="new-password"
                disabled={pending}
                id="settingsNewPassword"
                onChange={handleNewPasswordOnChange}
                type="password"
                value={newPassword}
              />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block text-sm font-medium" htmlFor="settingsConfirmPassword">
                {t("confirmPassword")}
              </Label>
              <Input
                autoComplete="new-password"
                disabled={pending}
                id="settingsConfirmPassword"
                onChange={handleConfirmPasswordOnChange}
                type="password"
                value={confirmPassword}
              />
            </div>
            {error != null && <p className="text-destructive text-xs">{error}</p>}
            {showEmailFallbackLink && (
              <Button disabled={pending} onClick={handleStartEmailFallback} type="button" variant="tertiary">
                {pending && <Loader2 className="size-3.5 animate-spin" />}
                {t("verifyViaEmail")}
              </Button>
            )}
            <Button
              disabled={
                pending || currentPassword.length === 0 || newPassword.length === 0 || confirmPassword.length === 0
              }
              onClick={handlePasswordUpdate}
              variant="secondary"
            >
              {pending && <Loader2 className="size-3.5 animate-spin" />}
              {t("updatePassword")}
            </Button>
          </>
        )}

        {step === "email-fallback" && (
          <>
            <p className="text-muted-foreground text-sm">{t("enterTheCodeWeSentToYourEmail")}</p>
            <div className="flex items-center gap-2">
              <InputOTP disabled={pending} maxLength={6} onChange={handleOtpOnChange} value={code}>
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
              {pending && <Loader2 className="size-3.5 animate-spin" />}
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block text-sm font-medium" htmlFor="fallbackNewPassword">
                {t("newPassword")}
              </Label>
              <Input
                autoComplete="new-password"
                disabled={pending}
                id="fallbackNewPassword"
                onChange={handleNewPasswordOnChange}
                type="password"
                value={newPassword}
              />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block text-sm font-medium" htmlFor="fallbackConfirmPassword">
                {t("confirmPassword")}
              </Label>
              <Input
                autoComplete="new-password"
                disabled={pending}
                id="fallbackConfirmPassword"
                onChange={handleConfirmPasswordOnChange}
                type="password"
                value={confirmPassword}
              />
            </div>
            {error != null && <p className="text-destructive text-xs">{error}</p>}
            <div className="flex gap-2">
              <Button
                disabled={
                  pending ||
                  code.length < 6 ||
                  newPassword.length < 8 ||
                  confirmPassword.length < 8 ||
                  newPassword !== confirmPassword
                }
                onClick={handleEmailFallbackSubmit}
                variant="secondary"
              >
                {pending && <Loader2 className="size-3.5 animate-spin" />}
                {t("updatePassword")}
              </Button>
              <Button disabled={pending} onClick={resetState} variant="tertiary">
                {t("cancel")}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
