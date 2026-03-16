"use client";

import { type DateRange } from "@/lib/db/queries/analytics";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";

export const DateRangeSelect: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = (searchParams.get("range") as DateRange) ?? "7d";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", e.target.value);
    router.replace(`?${params.toString()}`);
  };

  return (
    <select
      className="border-input bg-background text-foreground rounded-md border px-3 py-1.5 text-sm"
      onChange={handleChange}
      value={value}
    >
      <option value="7d">{t("last7Days")}</option>
      <option value="30d">{t("last30Days")}</option>
      <option value="all">{t("allTime")}</option>
    </select>
  );
};
