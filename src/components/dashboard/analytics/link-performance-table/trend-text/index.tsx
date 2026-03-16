import * as React from "react";

export type TrendTextProps = {
  value: null | number;
};

export const TrendText: React.FC<TrendTextProps> = (props) => {
  const { value } = props;

  //* Variables
  const isPositive = (value ?? 0) > 0;

  if (value == null || value === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span className={isPositive ? "text-emerald-500" : "text-red-500"}>
      {isPositive ? "↑" : "↓"} {Math.abs(value)}%
    </span>
  );
};
