import { cn } from "@/lib/utils";
import * as React from "react";

export type CardProps = React.ComponentProps<"div">;

export const Card: React.FC<CardProps> = (props) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn("bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm", className)}
      data-slot="card"
      {...rest}
    />
  );
};

export type CardHeaderProps = React.ComponentProps<"div">;

export const CardHeader: React.FC<CardHeaderProps> = (props) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      data-slot="card-header"
      {...rest}
    />
  );
};

export type CardTitleProps = React.ComponentProps<"div">;

export const CardTitle: React.FC<CardTitleProps> = (props) => {
  const { className, ...rest } = props;

  return <div className={cn("leading-none font-semibold", className)} data-slot="card-title" {...rest} />;
};

export type CardDescriptionProps = React.ComponentProps<"div">;

export const CardDescription: React.FC<CardDescriptionProps> = (props) => {
  const { className, ...rest } = props;

  return <div className={cn("text-muted-foreground text-sm", className)} data-slot="card-description" {...rest} />;
};

export type CardActionProps = React.ComponentProps<"div">;

export const CardAction: React.FC<CardActionProps> = (props) => {
  const { className, ...rest } = props;

  return (
    <div
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      data-slot="card-action"
      {...rest}
    />
  );
};

export type CardContentProps = React.ComponentProps<"div">;

export const CardContent: React.FC<CardContentProps> = (props) => {
  const { className, ...rest } = props;

  return <div className={cn("px-6", className)} data-slot="card-content" {...rest} />;
};

export type CardFooterProps = React.ComponentProps<"div">;

export const CardFooter: React.FC<CardFooterProps> = (props) => {
  const { className, ...rest } = props;

  return <div className={cn("flex items-center px-6 [.border-t]:pt-6", className)} data-slot="card-footer" {...rest} />;
};
