import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

export const buttonVariants = cva(
  "inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30",
  {
    defaultVariants: { size: "md", variant: "primary" },
    variants: {
      size: {
        lg: "h-11 rounded-md px-6 has-[>svg]:px-4",
        md: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
      },
      variant: {
        primary: "bg-primary text-primary-foreground hover:opacity-90",
        secondary:
          "border border-primary/40 text-primary bg-transparent hover:bg-primary hover:text-primary-foreground hover:border-primary",
        tertiary:
          "bg-muted-foreground/10 text-muted-foreground/70 hover:bg-muted-foreground/18 hover:text-muted-foreground/85",
      },
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export const Button: React.FC<ButtonProps> = (props) => {
  const { asChild = false, className, size = "md", variant = "primary", ...rest } = props;

  //* Variables
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      className={cn(buttonVariants({ className, size, variant }))}
      data-size={size}
      data-slot="button"
      data-variant={variant}
      {...rest}
    />
  );
};
