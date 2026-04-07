"use client";

import { cn } from "@/lib/utils";
import { CheckIcon, MinusIcon } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import * as React from "react";

export type CheckboxProps = React.ComponentProps<typeof CheckboxPrimitive.Root>;

export const Checkbox: React.FC<CheckboxProps> = (props) => {
  const { className, ...rest } = props;

  return (
    <CheckboxPrimitive.Root
      className={cn(
        "group border-input data-[state=checked]:bg-primary data-[state=indeterminate]:bg-primary data-[state=checked]:border-primary data-[state=indeterminate]:border-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:text-primary-foreground peer focus-visible:ring-ring/30 size-4 shrink-0 cursor-pointer rounded-sm border transition-colors outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      data-slot="checkbox"
      {...rest}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <CheckIcon className="size-3 group-data-[state=indeterminate]:hidden" />
        <MinusIcon className="size-3 group-data-[state=checked]:hidden" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
};
