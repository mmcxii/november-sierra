"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";

export type BrandPulseProps = {
  /** Boot splash uses a larger mark; nav overlay stays compact. */
  size?: "lg" | "sm";
};

export const BrandPulse: React.FC<BrandPulseProps> = (props) => {
  const { size = "sm" } = props;

  //* State
  const { t } = useTranslation();

  //* Variables
  const isLarge = size === "lg";

  return (
    <div
      aria-label={t("loading")}
      className={isLarge ? "sf-brand-pulse sf-brand-pulse-lg" : "sf-brand-pulse"}
      role="status"
    >
      <span aria-hidden="true" className="sf-brand-pulse-ember" />
      <span aria-hidden="true" className="sf-brand-pulse-mark">
        75
      </span>
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
};
