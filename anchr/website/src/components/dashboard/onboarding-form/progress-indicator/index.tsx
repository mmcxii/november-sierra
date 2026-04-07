import { cn } from "@/lib/utils";
import * as React from "react";
import { STEPS } from "../utils";

export type ProgressIndicatorProps = {
  stepIndex: number;
};

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = (props) => {
  const { stepIndex } = props;

  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.slice(0, 3).map((step, i) => (
        <div
          className={cn("h-1.5 w-12 rounded-full transition-colors", {
            "bg-muted": i > stepIndex,
            "bg-primary": i <= stepIndex,
          })}
          key={step}
        />
      ))}
    </div>
  );
};
