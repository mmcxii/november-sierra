import * as React from "react";

type SummaryRowProps = {
  label: string;
  value: string;
};

export const SummaryRow: React.FC<SummaryRowProps> = (props) => {
  const { label, value } = props;

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
};
