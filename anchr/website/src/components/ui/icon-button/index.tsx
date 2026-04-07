import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

export const iconButtonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center rounded-md p-2 transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    defaultVariants: { variant: "default" },
    variants: {
      variant: {
        default: "text-muted-foreground hover:bg-accent hover:text-foreground",
        destructive: "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
      },
    },
  },
);

export type IconButtonProps = React.ComponentProps<"button"> & VariantProps<typeof iconButtonVariants>;

export const IconButton: React.FC<IconButtonProps> = (props) => {
  const { className, variant = "default", ...rest } = props;

  return (
    <button
      className={cn(iconButtonVariants({ className, variant }))}
      data-slot="icon-button"
      data-variant={variant}
      type="button"
      {...rest}
    />
  );
};
