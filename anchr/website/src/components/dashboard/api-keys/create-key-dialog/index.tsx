"use client";

import { checkRevokedNameExists, createApiKey } from "@/app/(dashboard)/dashboard/api/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidApiKeyName } from "@/lib/api-keys";
import type { TranslationKey } from "@/lib/i18n/i18next.d";
import { Check, Copy, Loader2, TriangleAlert } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type Step = "done" | "name";

export type CreateKeyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const CreateKeyDialog: React.FC<CreateKeyDialogProps> = (props) => {
  const { onOpenChange, open } = props;

  const { t } = useTranslation();
  const [step, setStep] = React.useState<Step>("name");
  const [name, setName] = React.useState("");
  const [rawKey, setRawKey] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [revokedWarning, setRevokedWarning] = React.useState(false);
  const [error, setError] = React.useState<null | string>(null);
  const [dismissAttempts, setDismissAttempts] = React.useState(0);
  const [showDismissWarning, setShowDismissWarning] = React.useState(false);

  // Reset state when dialog closes (not on open — prevents remount from wiping state)
  const prevOpenRef = React.useRef(open);
  React.useEffect(() => {
    if (prevOpenRef.current && !open) {
      setStep("name");
      setName("");
      setRawKey("");
      setIsCreating(false);
      setCopied(false);
      setRevokedWarning(false);
      setError(null);
      setDismissAttempts(0);
      setShowDismissWarning(false);
    }
    prevOpenRef.current = open;
  }, [open]);

  const debounceRef = React.useRef<null | ReturnType<typeof setTimeout>>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setError(null);
    setRevokedWarning(false);

    if (debounceRef.current != null) {
      clearTimeout(debounceRef.current);
    }

    if (value.trim().length > 0) {
      debounceRef.current = setTimeout(async () => {
        const hasRevoked = await checkRevokedNameExists(value);
        if (hasRevoked) {
          setRevokedWarning(true);
        }
      }, 300);
    }
  };

  const handleCreate = async () => {
    const trimmed = name.trim();

    if (!isValidApiKeyName(trimmed)) {
      setError(t("invalidApiKeyNameUseLettersNumbersSpacesHyphensOrUnderscoresMax64Characters"));
      return;
    }

    setIsCreating(true);

    let result: Awaited<ReturnType<typeof createApiKey>>;
    try {
      result = await createApiKey(trimmed);
    } catch {
      setIsCreating(false);
      setError(t("somethingWentWrongPleaseTryAgain"));
      return;
    }

    setIsCreating(false);

    if (!result.success) {
      setError(t((result.error ?? "somethingWentWrongPleaseTryAgain") as TranslationKey));
      return;
    }

    setRawKey(result.rawKey ?? "");
    setStep("done");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rawKey);
    setCopied(true);
    toast.success(t("copied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && step === "name" && !isCreating) {
      void handleCreate();
    }
  };

  // Prevent closing during "done" step by clicking outside (user must click Done)
  const handleOpenChange = (value: boolean) => {
    if (step === "done" && !value) {
      const next = dismissAttempts + 1;
      setDismissAttempts(next);
      if (next >= 2) {
        setShowDismissWarning(true);
      }
      return;
    }
    onOpenChange(value);
  };

  const handleButtonOnClick = () => onOpenChange(false);

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent>
        {step === "name" && (
          <>
            <DialogHeader>
              <DialogTitle>{t("createApiKey")}</DialogTitle>
              <DialogDescription>{t("giveYourApiKeyANameToIdentifyIt")}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="api-key-name">{t("name")}</Label>
              <Input
                autoFocus
                id="api-key-name"
                maxLength={64}
                onChange={handleNameChange}
                onKeyDown={handleKeyDown}
                placeholder={t("myApiKey")}
                value={name}
              />
              {error != null && <p className="text-destructive text-sm">{error}</p>}
              {revokedWarning && (
                <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <TriangleAlert className="size-3.5 shrink-0" />
                  {t("aRevokedKeyWithThisNameAlreadyExists")}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button disabled={isCreating || name.trim().length === 0} onClick={handleCreate}>
                {isCreating && <Loader2 className="size-3.5 animate-spin" />}
                {t("create")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "done" && (
          <>
            <DialogHeader>
              <DialogTitle>{t("apiKeyCreated")}</DialogTitle>
              <DialogDescription>{t("copyYourApiKeyNowYouWontBeAbleToSeeItAgain")}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <div className="bg-muted flex items-center gap-2 rounded-md p-3">
                <code className="flex-1 text-sm break-all">{rawKey}</code>
                <Button onClick={handleCopy} size="sm" variant="secondary">
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </Button>
              </div>
              <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <TriangleAlert className="size-3.5 shrink-0" />
                {t("thisKeyWillOnlyBeShownOnce")}
              </p>
              {showDismissWarning && (
                <p className="text-destructive flex items-center gap-1.5 text-sm">
                  <TriangleAlert className="size-3.5 shrink-0" />
                  {t("pleaseCopyYourApiKeyBeforeClosingItWontBeShownAgain")}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleButtonOnClick}>{t("done")}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
