import { Check } from "lucide-react";
import * as React from "react";

export type FeatureItemProps = {
  label: string;
};

export const FeatureItem: React.FC<FeatureItemProps> = (props) => {
  const { label } = props;

  return (
    <li className="flex items-center gap-3">
      <Check className="m-accent-color size-4 shrink-0" />
      <span className="m-muted-70">{label}</span>
    </li>
  );
};
