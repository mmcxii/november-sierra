import { cn } from "@/lib/utils";
import * as React from "react";

export type TrendBadgeProps = {
  value: number;
};

export const TrendBadge: React.FC<TrendBadgeProps> = (props) => {
  const { value } = props;

  //* Variables
  const isPositive = value > 0;

  if (value === 0) {
    return (
      // eslint-disable-next-line anchr/no-raw-string-jsx -- numeric display with percent symbol
      <span className="text-muted-foreground text-sm font-medium">0%</span>
    );
  }

  return (
    <span className={cn("text-sm font-medium", { "text-emerald-500": isPositive, "text-red-500": !isPositive })}>
      {/* eslint-disable-next-line anchr/no-raw-string-jsx -- decorative arrows and percent symbol */}
      {isPositive ? "\u2191" : "\u2193"} {Math.abs(value)}%
    </span>
  );
};
