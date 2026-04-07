"use client";

import { type DateRange } from "@/lib/db/queries/analytics";
import { Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type DateRangeSelectProps = {
  isPro: boolean;
};

export const DateRangeSelect: React.FC<DateRangeSelectProps> = (props) => {
  const { isPro } = props;

  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = (searchParams.get("range") as DateRange) ?? "7d";

  const handleChange = (range: DateRange) => {
    if (!isPro && range !== "7d") {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.replace(`?${params.toString()}`);
  };

  const options: { label: string; proOnly: boolean; value: DateRange }[] = [
    { label: t("last7Days"), proOnly: false, value: "7d" },
    { label: t("last30Days"), proOnly: true, value: "30d" },
    { label: t("allTime"), proOnly: true, value: "all" },
  ];

  return (
    <div className="flex items-center gap-1">
      {options.map((option) => {
        const isActive = value === option.value;
        const isLocked = option.proOnly && !isPro;

        const handleButtonOnClick = () => handleChange(option.value);

        return (
          <button
            className="text-muted-foreground data-[active=true]:bg-secondary data-[active=true]:text-foreground flex items-center gap-1 rounded-md px-2.5 py-1 text-sm transition-colors disabled:opacity-50"
            data-active={isActive}
            disabled={isLocked}
            key={option.value}
            onClick={handleButtonOnClick}
            title={isLocked ? t("upgradeToPro") : undefined}
            type="button"
          >
            {option.label}
            {isLocked && <Lock className="size-3" />}
          </button>
        );
      })}
    </div>
  );
};
