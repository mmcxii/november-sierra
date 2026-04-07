"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type StatusBadgeProps = {
  status: "active" | "deactivated" | "exhausted" | "expired";
};

export const StatusBadge: React.FC<StatusBadgeProps> = (props) => {
  const { status } = props;

  const { t } = useTranslation();

  return (
    <span
      className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", {
        "bg-green-500/15 text-green-700 dark:text-green-400": status === "active",
        "bg-muted text-muted-foreground": status === "deactivated" || status === "exhausted",
        "bg-red-500/15 text-red-700 dark:text-red-400": status === "expired",
      })}
    >
      {t(status)}
    </span>
  );
};
