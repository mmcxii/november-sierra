"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type Interval = "annual" | "monthly";

const cardBase =
  "relative overflow-hidden rounded-2xl backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg";
const cardClasses = "m-card-bg-bg m-card-border";
const accentBar = <div className="m-accent-gradient-bg absolute inset-x-0 top-0 h-px" />;

const FREE_FEATURES = ["upTo5Links", "anchrToUsernameUrl", "basicAnalytics", "fourThemes"] as const;

const PRO_FEATURES = [
  "unlimitedLinks",
  "advancedAnalytics",
  "customDomains",
  "fullThemeCustomization",
  "prioritySupport",
] as const;

const FeatureItem: React.FC<{ label: string }> = ({ label }) => (
  <li className="flex items-center gap-3">
    <Check className="m-accent-color size-4 shrink-0" />
    <span className="m-muted-70">{label}</span>
  </li>
);

export const PricingCards: React.FC = () => {
  const { t } = useTranslation();
  const [interval, setInterval] = useState<Interval>("monthly");

  const pill = (value: Interval, label: string) => {
    const active = interval === value;
    return (
      <button
        className={cn("rounded-full px-5 py-2 text-sm font-medium transition-colors", {
          "m-accent-bg m-page-bg-color": active,
          "m-muted-10-bg m-muted-50": !active,
        })}
        onClick={() => setInterval(value)}
        type="button"
      >
        {label}
      </button>
    );
  };

  return (
    <>
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          {pill("monthly", t("monthly"))}
          {pill("annual", t("annual"))}
        </div>
        <span
          className={cn(
            "m-accent-12-bg m-accent-color rounded-full px-2.5 py-0.5 text-xs font-semibold transition-opacity",
            { "opacity-0": interval !== "annual", "opacity-100": interval === "annual" },
          )}
        >
          {t("save$24")}
        </span>
      </div>

      <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
        {/* Free card */}
        <div className={cn(cardBase, cardClasses, "p-8")}>
          {accentBar}
          <h3 className="mb-4 text-xl font-bold">{t("free")}</h3>
          <p className="m-muted-50 mb-6 text-sm">{t("youAreJustTestingTheWaters")}</p>
          <div className="mb-2 text-4xl font-bold">$0</div>
          <p className="m-muted-50 mb-8 text-sm">{t("freeForever")}</p>
          <ul className="flex flex-col gap-3">
            {FREE_FEATURES.map((key) => (
              <FeatureItem key={key} label={t(key)} />
            ))}
          </ul>
        </div>

        {/* Pro card */}
        <div className={cn(cardBase, "m-card-bg-bg m-card-border-2 p-8")}>
          {accentBar}
          <div className="mb-4 flex items-center gap-3">
            <h3 className="text-xl font-bold">{t("pro")}</h3>
            <span className="m-accent-12-bg m-accent-color rounded-full px-3 py-1 text-xs font-semibold">
              {t("mostPopular")}
            </span>
          </div>
          <p className="m-muted-50 mb-6 text-sm">{t("youAreReadyToChartYourOwnCourse")}</p>
          <div className="mb-2 text-4xl font-bold">{interval === "monthly" ? t("$7Mo") : t("$5Mo")}</div>
          <p className={cn("m-muted-50 mb-8 text-sm", { invisible: interval !== "annual" })}>
            {t("$60BilledAnnually")}
          </p>
          <p className="m-muted-50 mb-4 text-sm font-medium">{t("everythingInFreePlus")}</p>
          <ul className="flex flex-col gap-3">
            {PRO_FEATURES.map((key) => (
              <FeatureItem key={key} label={t(key)} />
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};
