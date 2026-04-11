"use client";

import { useStripeCheckout } from "@/lib/use-stripe-checkout";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { CARD_BASE, CARD_CLASSES, CTA_CLASSES, FREE_FEATURES, PRO_FEATURES } from "./constants";
import { FeatureItem } from "./feature-item";

type Interval = "annual" | "monthly";

export type PricingViewer = "anonymous" | "free" | "pro";

export type PricingCardsProps = {
  viewer: PricingViewer;
};

export const PricingCards: React.FC<PricingCardsProps> = (props) => {
  const { viewer } = props;

  //* State
  const { t } = useTranslation();
  const [interval, setInterval] = React.useState<Interval>("monthly");
  const { loading: checkoutLoading, startCheckout } = useStripeCheckout();

  //* Variables
  const freeCtaHref = viewer === "anonymous" ? "/sign-up" : "/dashboard";

  //* Handlers
  const pill = (value: Interval, label: string) => {
    const active = interval === value;
    const handleButtonOnClick = () => setInterval(value);

    return (
      <button
        className={cn("rounded-full px-5 py-2 text-sm font-medium transition-colors", {
          "m-accent-bg m-page-bg-color": active,
          "m-muted-10-bg m-muted-50": !active,
        })}
        onClick={handleButtonOnClick}
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
        <div className={cn(CARD_BASE, CARD_CLASSES, "flex flex-col p-8")}>
          <div className="m-accent-gradient-bg absolute inset-x-0 top-0 h-px" />
          <h3 className="mb-4 text-xl font-bold">{t("free")}</h3>
          <p className="m-muted-50 mb-6 text-sm">{t("youreJustTestingTheWaters")}</p>
          <div className="mb-2 text-4xl font-bold">{t("$0")}</div>
          <p className="m-muted-50 mb-8 text-sm">{t("freeForever")}</p>
          <ul className="flex flex-col gap-3">
            {FREE_FEATURES.map((key) => (
              <FeatureItem key={key} label={t(key)} />
            ))}
          </ul>
          {viewer !== "pro" && (
            <Link className={cn(CTA_CLASSES, "m-muted-10-bg m-muted-70 mt-auto")} href={freeCtaHref}>
              {t("getStarted")}
            </Link>
          )}
        </div>

        {/* Pro card */}
        <div className={cn(CARD_BASE, "m-card-bg-bg m-card-border-2 flex flex-col p-8")}>
          <div className="m-accent-gradient-bg absolute inset-x-0 top-0 h-px" />
          <div className="mb-4 flex items-center gap-3">
            <h3 className="text-xl font-bold">{t("pro")}</h3>
            <span className="m-accent-12-bg m-accent-color rounded-full px-3 py-1 text-xs font-semibold">
              {t("mostPopular")}
            </span>
          </div>
          <p className="m-muted-50 mb-6 text-sm">{t("youreReadyToChartYourOwnCourse")}</p>
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
          {viewer === "anonymous" && (
            <Link className={cn(CTA_CLASSES, "m-accent-bg m-page-bg-color mt-auto")} href="/sign-up">
              {t("upgradeToPro")}
            </Link>
          )}
          {viewer === "free" && (
            <button
              className={cn(CTA_CLASSES, "m-accent-bg m-page-bg-color mt-auto")}
              disabled={checkoutLoading}
              onClick={startCheckout}
              type="button"
            >
              {checkoutLoading && <Loader2 className="size-4 animate-spin" />}
              {t("upgradeToPro")}
            </button>
          )}
        </div>
      </div>
    </>
  );
};
