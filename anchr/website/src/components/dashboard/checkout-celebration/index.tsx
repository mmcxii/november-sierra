"use client";

import { SiteLogo } from "@/components/marketing/site-logo";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type CheckoutCelebrationProps = {
  open: boolean;
  referral?: { durationDays: null | number; referrerName: null | string };
  onOpenChange: (open: boolean) => void;
};

export const CheckoutCelebration: React.FC<CheckoutCelebrationProps> = (props) => {
  const { onOpenChange, open, referral } = props;

  //* State
  const { t } = useTranslation();
  const [mounted, setMounted] = React.useState(open);
  const [visible, setVisible] = React.useState(false);

  //* Handlers
  const handleTransitionEnd = () => {
    if (!visible) {
      setMounted(false);
    }
  };

  const handleButtonOnClick = () => onOpenChange(false);

  //* Effects
  React.useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      aria-label={t("youreAnchored")}
      aria-modal="true"
      className="bg-anc-deep-navy/95 fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300"
      data-theme="dark-depths"
      onTransitionEnd={handleTransitionEnd}
      role="dialog"
      // eslint-disable-next-line november-sierra/no-inline-style -- dynamic opacity for mount/unmount transition
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* Wave texture */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern height="20" id="celebrationWaves" patternUnits="userSpaceOnUse" width="280" x="0" y="0">
            <path
              d="M-70,10 C-52.5,3 -17.5,17 0,10 C17.5,3 52.5,17 70,10 C87.5,3 122.5,17 140,10 C157.5,3 192.5,17 210,10 C227.5,3 262.5,17 280,10 C297.5,3 332.5,17 350,10"
              fill="none"
              stroke="rgba(212, 184, 150, 0.6)"
              strokeWidth="0.8"
            />
          </pattern>
        </defs>
        <rect fill="url(#celebrationWaves)" height="100%" width="100%" />
      </svg>

      {/* Content */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Sonar rings + logo */}
        <div className="relative flex items-center justify-center">
          <span className="anc-celebration-ring border-anc-gold/30 absolute size-40 rounded-full border-2" />
          <span
            className="anc-celebration-ring border-anc-gold/20 absolute size-40 rounded-full border-2"
            // eslint-disable-next-line november-sierra/no-inline-style -- staggered animation delay for sonar ring
            style={{ animationDelay: "0.8s" }}
          />
          <span
            className="anc-celebration-ring border-anc-gold/10 absolute size-40 rounded-full border-2"
            // eslint-disable-next-line november-sierra/no-inline-style -- staggered animation delay for sonar ring
            style={{ animationDelay: "1.6s" }}
          />

          <div className="anc-anchor-drop">
            <SiteLogo accent="212 184 150" cardBg="rgba(30, 45, 66, 0.4)" size="xl" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-anc-cream text-xl font-semibold">{t("youreAnchored")}</h2>
          <p className="text-anc-steel max-w-xs text-sm">{t("welcomeAboardProYoureReadyToChartYourOwnCourse")}</p>
          {referral?.referrerName != null && (
            <p className="text-anc-gold/80 max-w-xs text-sm">
              {t("{{name}}GuidedYouIntoPort", { name: referral.referrerName })}
            </p>
          )}
          {referral != null &&
            (referral.durationDays != null ? (
              <p className="text-anc-steel/60 max-w-xs text-xs">
                {t("enjoy{{days}}DaysOfPro", { days: referral.durationDays })}
              </p>
            ) : (
              <p className="text-anc-steel/60 max-w-xs text-xs">{t("enjoyLifetimeProOnUsSmoothSailing")}</p>
            ))}
        </div>

        <Button className="bg-anc-gold text-anc-deep-navy hover:bg-anc-gold/90" onClick={handleButtonOnClick}>
          {t("continue")}
        </Button>
      </div>
    </div>
  );
};
