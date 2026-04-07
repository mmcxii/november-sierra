"use client";

import { cn } from "@/lib/utils";
import { Label as LabelPrimitive } from "radix-ui";
import * as React from "react";

export type LabelProps = React.ComponentProps<typeof LabelPrimitive.Root>;

export const Label: React.FC<LabelProps> = (props) => {
  const { className, ...rest } = props;

  return (
    <LabelPrimitive.Root
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      data-slot="label"
      {...rest}
    />
  );
};
