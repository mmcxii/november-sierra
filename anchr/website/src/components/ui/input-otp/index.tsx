"use client";

import { cn } from "@/lib/utils";
import { OTPInput, OTPInputContext } from "input-otp";
import { MinusIcon } from "lucide-react";
import * as React from "react";

type InputOTPProps = React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
};

export const InputOTP: React.FC<InputOTPProps> = (props) => {
  const { className, containerClassName, ...rest } = props;

  return (
    <OTPInput
      className={cn("disabled:cursor-not-allowed", className)}
      containerClassName={cn("flex items-center gap-2 has-disabled:opacity-50", containerClassName)}
      data-slot="input-otp"
      {...rest}
    />
  );
};

export const InputOTPGroup: React.FC<React.ComponentProps<"div">> = (props) => {
  const { className, ...rest } = props;

  return <div className={cn("flex items-center", className)} data-slot="input-otp-group" {...rest} />;
};

type InputOTPSlotProps = React.ComponentProps<"div"> & {
  index: number;
};

export const InputOTPSlot: React.FC<InputOTPSlotProps> = (props) => {
  const { className, index, ...rest } = props;

  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      className={cn(
        "border-input relative flex h-9 w-9 items-center justify-center border-y border-r text-sm shadow-xs transition-all outline-none first:rounded-l-md first:border-l last:rounded-r-md",
        "aria-invalid:border-destructive",
        "data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:z-10 data-[active=true]:ring-[3px]",
        "data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/20",
        "dark:bg-input/30 dark:data-[active=true]:aria-invalid:ring-destructive/40",
        className,
      )}
      data-active={isActive}
      data-slot="input-otp-slot"
      {...rest}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      )}
    </div>
  );
};

export const InputOTPSeparator: React.FC<React.ComponentProps<"div">> = (props) => {
  return (
    <div data-slot="input-otp-separator" role="separator" {...props}>
      <MinusIcon />
    </div>
  );
};
