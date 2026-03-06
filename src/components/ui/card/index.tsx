import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import { Anchor } from "lucide-react";
import * as React from "react";

const cardVariants = cva("flex flex-col gap-6 rounded-xl py-6 shadow-sm", {
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: "bg-card text-card-foreground border",
      featured: "relative overflow-hidden border-0 bg-(--m-card-bg) text-[rgb(var(--m-text))]",
    },
  },
});

const CORNER_POSITIONS = ["top-4 left-4", "top-4 right-4 rotate-180", "bottom-4 left-4 rotate-180", "bottom-4 right-4"];

export type CardProps = React.ComponentProps<"div"> & VariantProps<typeof cardVariants>;

export const Card: React.FC<CardProps> = (props) => {
  const { children, className, variant, ...rest } = props;

  return (
    <div className={cn(cardVariants({ variant }), className)} data-slot="card" {...rest}>
      {variant === "featured" && (
        <>
          <div className="pointer-events-none absolute inset-[10px] rounded-xl border border-[rgb(var(--m-accent)/0.25)]" />
          {CORNER_POSITIONS.map((pos) => (
            <div className={cn("pointer-events-none absolute text-[rgb(var(--m-accent)/0.35)]", pos)} key={pos}>
              <Anchor className="size-3.5" strokeWidth={1.5} />
            </div>
          ))}
        </>
      )}
      {children}
    </div>
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
