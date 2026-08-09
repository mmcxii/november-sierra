"use client";

import { cn } from "@/lib/utils";
import { CircleIcon } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import * as React from "react";

export type DropdownMenuProps = React.ComponentProps<typeof DropdownMenuPrimitive.Root>;

export const DropdownMenu: React.FC<DropdownMenuProps> = (props) => {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
};

export type DropdownMenuTriggerProps = React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>;

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = (props) => {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
};

export type DropdownMenuContentProps = React.ComponentProps<typeof DropdownMenuPrimitive.Content>;

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = (props) => {
  const { className, sideOffset = 4, ...rest } = props;

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        className={cn(
          "border-sf-border bg-sf-elevated text-sf-text z-50 min-w-[8rem] overflow-hidden rounded-[var(--sf-radius)] border p-1 shadow-lg",
          className,
        )}
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  );
};

export type DropdownMenuRadioGroupProps = React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>;

export const DropdownMenuRadioGroup: React.FC<DropdownMenuRadioGroupProps> = (props) => {
  return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
};

export type DropdownMenuRadioItemProps = React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>;

export const DropdownMenuRadioItem: React.FC<DropdownMenuRadioItemProps> = (props) => {
  const { children, className, ...rest } = props;

  return (
    <DropdownMenuPrimitive.RadioItem
      className={cn(
        "focus:bg-sf-accent/15 relative flex cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      data-slot="dropdown-menu-radio-item"
      {...rest}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="fill-sf-accent size-2" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
};

export type DropdownMenuItemProps = React.ComponentProps<typeof DropdownMenuPrimitive.Item>;

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = (props) => {
  const { className, ...rest } = props;

  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "focus:bg-sf-accent/15 relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      data-slot="dropdown-menu-item"
      {...rest}
    />
  );
};
