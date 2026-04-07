"use client";

import { createWebhookAction } from "@/app/(dashboard)/dashboard/api/webhook-actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { WEBHOOK_EVENTS, type WebhookEvent } from "@/lib/api/schemas/webhook";
import type { TranslationKey } from "@/lib/i18n/i18next.d";
import { Check, Copy, Loader2, TriangleAlert } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type Step = "form" | "secret";

export type CreateWebhookDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const CreateWebhookDialog: React.FC<CreateWebhookDialogProps> = (props) => {
  const { onOpenChange, open } = props;

  const { t } = useTranslation();

  const [step, setStep] = React.useState<Step>("form");
  const [url, setUrl] = React.useState("");
  const [selectedEvents, setSelectedEvents] = React.useState<WebhookEvent[]>([]);
  const [secret, setSecret] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<null | string>(null);
  const [dismissAttempts, setDismissAttempts] = React.useState(0);
  const [showDismissWarning, setShowDismissWarning] = React.useState(false);

  const prevOpenRef = React.useRef(open);
  React.useEffect(() => {
    if (prevOpenRef.current && !open) {
      setStep("form");
      setUrl("");
      setSelectedEvents([]);
      setSecret("");
      setIsCreating(false);
      setCopied(false);
      setError(null);
      setDismissAttempts(0);
      setShowDismissWarning(false);
    }
    prevOpenRef.current = open;
  }, [open]);

  const handleEventToggle = (event: WebhookEvent) => {
    setSelectedEvents((prev) => (prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]));
  };

  const handleCreate = async () => {
    setError(null);
    setIsCreating(true);

    let result: Awaited<ReturnType<typeof createWebhookAction>>;
    try {
      result = await createWebhookAction(url.trim(), selectedEvents);
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

    setSecret(result.secret ?? "");
    setStep("secret");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success(t("copied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenChange = (value: boolean) => {
    if (step === "secret" && !value) {
      const next = dismissAttempts + 1;
      setDismissAttempts(next);
      if (next >= 2) {
        setShowDismissWarning(true);
      }
      return;
    }
    onOpenChange(value);
  };

  const handleDone = () => onOpenChange(false);

  const handleInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError(null);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent>
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>{t("createWebhook")}</DialogTitle>
              <DialogDescription>{t("configureAWebhookEndpointToReceiveEventNotifications")}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="webhook-url">{t("endpointUrl")}</Label>
                <Input
                  autoFocus
                  id="webhook-url"
                  onChange={handleInputOnChange}
                  placeholder="https://example.com/webhooks"
                  value={url}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("events")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {WEBHOOK_EVENTS.map((event) => {
                    const handleCheckedChange = () => {
                      handleEventToggle(event);
                    };
                    return (
                      <label className="flex items-center gap-2 text-sm" key={event}>
                        <Checkbox checked={selectedEvents.includes(event)} onCheckedChange={handleCheckedChange} />
                        <code className="text-xs">{event}</code>
                      </label>
                    );
                  })}
                </div>
              </div>
              {error != null && <p className="text-destructive text-sm">{error}</p>}
            </div>
            <DialogFooter>
              <Button
                disabled={isCreating || url.trim().length === 0 || selectedEvents.length === 0}
                onClick={handleCreate}
              >
                {isCreating && <Loader2 className="size-3.5 animate-spin" />}
                {t("create")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "secret" && (
          <>
            <DialogHeader>
              <DialogTitle>{t("webhookCreated")}</DialogTitle>
              <DialogDescription>{t("copyYourSigningSecretNowYouWontBeAbleToSeeItAgain")}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <div className="bg-muted flex items-center gap-2 rounded-md p-3">
                <code className="flex-1 text-sm break-all">{secret}</code>
                <Button onClick={handleCopy} size="sm" variant="secondary">
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </Button>
              </div>
              <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <TriangleAlert className="size-3.5 shrink-0" />
                {t("thisSecretWillOnlyBeShownOnce")}
              </p>
              {showDismissWarning && (
                <p className="text-destructive flex items-center gap-1.5 text-sm">
                  <TriangleAlert className="size-3.5 shrink-0" />
                  {t("pleaseCopyYourSigningSecretBeforeClosingItWontBeShownAgain")}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleDone}>{t("done")}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
