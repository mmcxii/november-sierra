"use client";

import { updatePageDarkTheme, updatePageLightTheme } from "@/app/(dashboard)/dashboard/settings/actions";
import { completeOnboarding } from "@/app/onboarding/actions";
import { ThemeSwatch } from "@/components/dashboard/theme-swatch";
import { Button } from "@/components/ui/button";
import { DARK_THEME_ID_LIST, LIGHT_THEME_ID_LIST, THEMES, type ThemeId } from "@/lib/themes";
import { Loader2, Palette } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type ThemeStepProps = {
  onComplete: () => void;
  onSkip: () => void;
};

export const ThemeStep: React.FC<ThemeStepProps> = (props) => {
  const { onComplete, onSkip } = props;

  const { t } = useTranslation();
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedDark, setSelectedDark] = React.useState<ThemeId>("dark-depths");
  const [selectedLight, setSelectedLight] = React.useState<ThemeId>("stateroom");

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const [darkResult, lightResult] = await Promise.all([
        updatePageDarkTheme(selectedDark),
        updatePageLightTheme(selectedLight),
      ]);
      if (!darkResult.success || !lightResult.success) {
        toast.error(t("somethingWentWrongPleaseTryAgain"));
        return;
      }
      const referralCode = localStorage.getItem("anchr_referral_code") ?? undefined;
      await completeOnboarding(referralCode);
      localStorage.removeItem("anchr_referral_code");
      onComplete();
    } catch {
      toast.error(t("somethingWentWrongPleaseTryAgain"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDarkThemeSwatchOnClick = (id: ThemeId) => () => setSelectedDark(id);

  const handleLightThemeSwatchOnClick = (id: ThemeId) => () => setSelectedLight(id);

  const handleSkip = async () => {
    setSubmitting(true);
    try {
      const referralCode = localStorage.getItem("anchr_referral_code") ?? undefined;
      await completeOnboarding(referralCode);
      localStorage.removeItem("anchr_referral_code");
      onSkip();
    } catch {
      toast.error(t("somethingWentWrongPleaseTryAgain"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center gap-2 text-center">
        <Palette className="text-muted-foreground size-8" />
        <h1 className="text-2xl font-semibold tracking-tight">{t("pickATheme")}</h1>
        <p className="text-muted-foreground text-sm">{t("youCanAlwaysChangeThisLater")}</p>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-muted-foreground mb-2 text-sm font-medium">{t("darkTheme")}</p>
          <div className="grid grid-cols-2 gap-3">
            {DARK_THEME_ID_LIST.map((id) => (
              <ThemeSwatch
                isSelected={selectedDark === id}
                key={id}
                name={THEMES[id].name}
                onClick={handleDarkThemeSwatchOnClick(id)}
                swatch={THEMES[id].swatch}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="text-muted-foreground mb-2 text-sm font-medium">{t("lightTheme")}</p>
          <div className="grid grid-cols-2 gap-3">
            {LIGHT_THEME_ID_LIST.map((id) => (
              <ThemeSwatch
                isSelected={selectedLight === id}
                key={id}
                name={THEMES[id].name}
                onClick={handleLightThemeSwatchOnClick(id)}
                swatch={THEMES[id].swatch}
              />
            ))}
          </div>
        </div>
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
