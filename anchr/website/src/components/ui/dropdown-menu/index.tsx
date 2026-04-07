"use client";

import { cn } from "@/lib/utils";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import * as React from "react";

export type DropdownMenuProps = React.ComponentProps<typeof DropdownMenuPrimitive.Root>;

export const DropdownMenu: React.FC<DropdownMenuProps> = (props) => {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
};

export type DropdownMenuPortalProps = React.ComponentProps<typeof DropdownMenuPrimitive.Portal>;

export const DropdownMenuPortal: React.FC<DropdownMenuPortalProps> = (props) => {
  return <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
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
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-[0_4px_24px_rgba(0,0,0,0.25)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)]",
          className,
        )}
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  );
};

export type DropdownMenuGroupProps = React.ComponentProps<typeof DropdownMenuPrimitive.Group>;

export const DropdownMenuGroup: React.FC<DropdownMenuGroupProps> = (props) => {
  return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
};

export type DropdownMenuItemProps = React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
};

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = (props) => {
  const { className, inset, variant = "default", ...rest } = props;

  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-inset={inset}
      data-slot="dropdown-menu-item"
      data-variant={variant}
      {...rest}
    />
  );
};

export type DropdownMenuCheckboxItemProps = React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>;

export const DropdownMenuCheckboxItem: React.FC<DropdownMenuCheckboxItemProps> = (props) => {
  const { checked, children, className, ...rest } = props;

  return (
    <DropdownMenuPrimitive.CheckboxItem
      checked={checked}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-slot="dropdown-menu-checkbox-item"
      {...rest}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
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
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-slot="dropdown-menu-radio-item"
      {...rest}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
};

export type DropdownMenuLabelProps = React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
};

export const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = (props) => {
  const { className, inset, ...rest } = props;

  return (
    <DropdownMenuPrimitive.Label
      className={cn("px-2 py-1.5 text-sm font-medium data-inset:pl-8", className)}
      data-inset={inset}
      data-slot="dropdown-menu-label"
      {...rest}
    />
  );
};

export type DropdownMenuSeparatorProps = React.ComponentProps<typeof DropdownMenuPrimitive.Separator>;

export const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = (props) => {
  const { className, ...rest } = props;

  return (
    <DropdownMenuPrimitive.Separator
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      data-slot="dropdown-menu-separator"
      {...rest}
    />
  );
};

export type DropdownMenuShortcutProps = React.ComponentProps<"span">;

export const DropdownMenuShortcut: React.FC<DropdownMenuShortcutProps> = (props) => {
  const { className, ...rest } = props;

  return (
    <span
      className={cn("text-muted-foreground ml-auto text-xs tracking-widest", className)}
      data-slot="dropdown-menu-shortcut"
      {...rest}
    />
  );
};

export type DropdownMenuSubProps = React.ComponentProps<typeof DropdownMenuPrimitive.Sub>;

export const DropdownMenuSub: React.FC<DropdownMenuSubProps> = (props) => {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
};

export type DropdownMenuSubTriggerProps = React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
};

export const DropdownMenuSubTrigger: React.FC<DropdownMenuSubTriggerProps> = (props) => {
  const { children, className, inset = false, ...rest } = props;

  return (
    <DropdownMenuPrimitive.SubTrigger
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-inset={inset}
      data-slot="dropdown-menu-sub-trigger"
      {...rest}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
};

export type DropdownMenuSubContentProps = React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>;

export const DropdownMenuSubContent: React.FC<DropdownMenuSubContentProps> = (props) => {
  const { className, ...rest } = props;

  return (
    <DropdownMenuPrimitive.SubContent
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
        className,
      )}
      data-slot="dropdown-menu-sub-content"
      {...rest}
    />
  );
};
