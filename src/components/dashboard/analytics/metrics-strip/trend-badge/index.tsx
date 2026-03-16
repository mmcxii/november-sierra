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
    return <span className="text-muted-foreground text-sm font-medium">0%</span>;
  }

  return (
    <span className={cn("text-sm font-medium", { "text-emerald-500": isPositive, "text-red-500": !isPositive })}>
      {isPositive ? "↑" : "↓"} {Math.abs(value)}%
    </span>
  );
};
