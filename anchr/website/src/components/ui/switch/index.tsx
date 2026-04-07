"use client";

import { cn } from "@/lib/utils";
import { Switch as SwitchPrimitive } from "radix-ui";
import * as React from "react";

export type SwitchProps = React.ComponentProps<typeof SwitchPrimitive.Root>;

export const Switch: React.FC<SwitchProps> = (props) => {
  const { className, ...rest } = props;

  return (
    <SwitchPrimitive.Root
      className={cn(
        "bg-input focus-visible:ring-ring/30 data-[state=checked]:bg-primary peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      data-slot="switch"
      {...rest}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "bg-background pointer-events-none block size-4 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitive.Root>
  );
};
