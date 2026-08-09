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
        "group peer border-sf-border bg-sf-elevated text-sf-accent-text focus-visible:ring-sf-accent/30 data-[state=checked]:border-sf-accent data-[state=checked]:bg-sf-accent data-[state=indeterminate]:border-sf-accent data-[state=indeterminate]:bg-sf-accent size-4 shrink-0 cursor-pointer rounded-[0.2rem] border transition-colors outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
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
