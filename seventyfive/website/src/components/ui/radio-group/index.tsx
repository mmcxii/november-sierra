"use client";

import { cn } from "@/lib/utils";
import { CircleIcon } from "lucide-react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import * as React from "react";

export type RadioGroupProps = React.ComponentProps<typeof RadioGroupPrimitive.Root>;

export const RadioGroup: React.FC<RadioGroupProps> = (props) => {
  const { className, ...rest } = props;

  return <RadioGroupPrimitive.Root className={cn("grid gap-2", className)} data-slot="radio-group" {...rest} />;
};

export type RadioGroupItemProps = React.ComponentProps<typeof RadioGroupPrimitive.Item>;

export const RadioGroupItem: React.FC<RadioGroupItemProps> = (props) => {
  const { className, ...rest } = props;

  return (
    <RadioGroupPrimitive.Item
      className={cn(
        "border-sf-border bg-sf-elevated text-sf-accent focus-visible:ring-sf-accent/30 data-[state=checked]:border-sf-accent aspect-square size-4 shrink-0 cursor-pointer rounded-full border transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      data-slot="radio-group-item"
      {...rest}
    >
      <RadioGroupPrimitive.Indicator className="relative flex items-center justify-center">
        <CircleIcon className="fill-sf-accent absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 stroke-none" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
};
