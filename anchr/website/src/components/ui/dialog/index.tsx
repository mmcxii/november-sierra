"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import * as React from "react";

export type DialogProps = React.ComponentProps<typeof DialogPrimitive.Root>;

export const Dialog: React.FC<DialogProps> = (props) => {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
};

export type DialogTriggerProps = React.ComponentProps<typeof DialogPrimitive.Trigger>;

export const DialogTrigger: React.FC<DialogTriggerProps> = (props) => {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
};

export type DialogPortalProps = React.ComponentProps<typeof DialogPrimitive.Portal>;

export const DialogPortal: React.FC<DialogPortalProps> = (props) => {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
};

export type DialogCloseProps = React.ComponentProps<typeof DialogPrimitive.Close>;

export const DialogClose: React.FC<DialogCloseProps> = (props) => {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
};

export type DialogOverlayProps = React.ComponentProps<typeof DialogPrimitive.Overlay>;

export const DialogOverlay: React.FC<DialogOverlayProps> = (props) => {
  const { className, ...rest } = props;

  return (
    <DialogPrimitive.Overlay
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-anc-deep-navy/50 fixed inset-0 z-50",
        className,
      )}
      data-slot="dialog-overlay"
      {...rest}
    />
  );
};

export type DialogContentProps = React.ComponentProps<typeof DialogPrimitive.Content>;

export const DialogContent: React.FC<DialogContentProps> = (props) => {
  const { children, className, ...rest } = props;

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 duration-200"
        data-slot="dialog-content"
        {...rest}
      >
        <Card className={cn("relative gap-4 p-6 shadow-lg", className)}>
          {children}
          <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
            <XIcon className="size-4" />
            {/* eslint-disable-next-line anchr/no-raw-string-jsx -- sr-only accessible label, not visible */}
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </Card>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
};

export type DialogHeaderProps = React.ComponentProps<"div">;

export const DialogHeader: React.FC<DialogHeaderProps> = (props) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      data-slot="dialog-header"
      {...rest}
    />
  );
};

export type DialogFooterProps = React.ComponentProps<"div">;

export const DialogFooter: React.FC<DialogFooterProps> = (props) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-start sm:gap-2", className)}
      data-slot="dialog-footer"
      {...rest}
    />
  );
};

export type DialogTitleProps = React.ComponentProps<typeof DialogPrimitive.Title>;

export const DialogTitle: React.FC<DialogTitleProps> = (props) => {
  const { className, ...rest } = props;

  return (
    <DialogPrimitive.Title
      className={cn("text-lg leading-none font-semibold tracking-tight", className)}
      data-slot="dialog-title"
      {...rest}
    />
  );
};

export type DialogDescriptionProps = React.ComponentProps<typeof DialogPrimitive.Description>;

export const DialogDescription: React.FC<DialogDescriptionProps> = (props) => {
  const { className, ...rest } = props;

  return (
    <DialogPrimitive.Description
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="dialog-description"
      {...rest}
    />
  );
};
