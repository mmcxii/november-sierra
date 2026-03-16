import { updateTheme } from "@/app/(dashboard)/dashboard/settings/actions";
import { completeOnboarding } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Loader2, Palette } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { ONBOARDING_THEMES } from "../utils";

export type ThemeStepProps = {
  onComplete: () => void;
  onSkip: () => void;
};

export const ThemeStep: React.FC<ThemeStepProps> = (props) => {
  const { onComplete, onSkip } = props;

  //* State
  const { t } = useTranslation();
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedTheme, setSelectedTheme] = React.useState("dark-depths");

  //* Handlers
  const handleSubmit = async () => {
    setSubmitting(true);
    await updateTheme(selectedTheme);
    await completeOnboarding();
    setSubmitting(false);
    onComplete();
  };

  const handleSkip = async () => {
    setSubmitting(true);
    await completeOnboarding();
    setSubmitting(false);
    onSkip();
  };

  return (
    <>
      <div className="flex flex-col items-center gap-2 text-center">
        <Palette className="text-muted-foreground size-8" />
        <h1 className="text-2xl font-semibold tracking-tight">{t("pickATheme")}</h1>
        <p className="text-muted-foreground text-sm">{t("youCanAlwaysChangeThisLater")}</p>
      </div>

      <div className="flex flex-col gap-3">
        {ONBOARDING_THEMES.map((theme) => (
          <button
            className={cn("flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-colors", {
              "border-border hover:border-muted-foreground/40": selectedTheme !== theme.id,
              "border-primary": selectedTheme === theme.id,
            })}
            key={theme.id}
            onClick={() => setSelectedTheme(theme.id)}
            type="button"
          >
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-md border", theme.boxClass)}>
              <span className={cn("text-xs font-bold", theme.letterClass)}>A</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{theme.label}</span>
            </div>
            {selectedTheme === theme.id && <Check className="text-primary ml-auto size-4" />}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Button className="w-full" disabled={submitting} onClick={handleSubmit} type="button">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : t("continue")}
        </Button>
        <Button className="w-full" disabled={submitting} onClick={handleSkip} type="button" variant="tertiary">
          {t("skip")}
        </Button>
      </div>
    </>
  );
};
