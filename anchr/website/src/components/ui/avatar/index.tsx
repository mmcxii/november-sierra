"use client";

import { cn } from "@/lib/utils";
import { Avatar as AvatarPrimitive } from "radix-ui";
import * as React from "react";

export type AvatarProps = React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: "default" | "lg" | "sm";
};

export const Avatar: React.FC<AvatarProps> = (props) => {
  const { className, size = "default", ...rest } = props;

  return (
    <AvatarPrimitive.Root
      className={cn(
        "group/avatar relative flex size-8 shrink-0 overflow-hidden rounded-full select-none data-[size=lg]:size-10 data-[size=sm]:size-6",
        className,
      )}
      data-size={size}
      data-slot="avatar"
      {...rest}
    />
  );
};

export type AvatarImageProps = React.ComponentProps<typeof AvatarPrimitive.Image>;

export const AvatarImage: React.FC<AvatarImageProps> = (props) => {
  const { className, ...rest } = props;

  return (
    <AvatarPrimitive.Image className={cn("aspect-square size-full", className)} data-slot="avatar-image" {...rest} />
  );
};

export type AvatarFallbackProps = React.ComponentProps<typeof AvatarPrimitive.Fallback>;

export const AvatarFallback: React.FC<AvatarFallbackProps> = (props) => {
  const { className, ...rest } = props;

  return (
    <AvatarPrimitive.Fallback
      className={cn(
        "bg-muted text-muted-foreground flex size-full items-center justify-center rounded-full text-sm group-data-[size=sm]/avatar:text-xs",
        className,
      )}
      data-slot="avatar-fallback"
      {...rest}
    />
  );
};

export type AvatarBadgeProps = React.ComponentProps<"span">;

export const AvatarBadge: React.FC<AvatarBadgeProps> = (props) => {
  const { className, ...rest } = props;

  return (
    <span
      className={cn(
        "bg-primary text-primary-foreground ring-background absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full ring-2 select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className,
      )}
      data-slot="avatar-badge"
      {...rest}
    />
  );
};

export type AvatarGroupProps = React.ComponentProps<"div">;

export const AvatarGroup: React.FC<AvatarGroupProps> = (props) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn(
        "*:data-[slot=avatar]:ring-background group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2",
        className,
      )}
      data-slot="avatar-group"
      {...rest}
    />
  );
};

export type AvatarGroupCountProps = React.ComponentProps<"div">;

export const AvatarGroupCount: React.FC<AvatarGroupCountProps> = (props) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn(
        "bg-muted text-muted-foreground ring-background relative flex size-8 shrink-0 items-center justify-center rounded-full text-sm ring-2 group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className,
      )}
      data-slot="avatar-group-count"
      {...rest}
    />
  );
};
