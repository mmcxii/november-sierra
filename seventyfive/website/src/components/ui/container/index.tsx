import { cn } from "@/lib/utils";
import * as React from "react";

export type ContainerProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
};

export const Container: React.FC<ContainerProps> = (props) => {
  const { as: Component = "div", className, ...rest } = props;

  return <Component className={cn("mx-auto w-full max-w-lg px-5 sm:px-6", className)} {...rest} />;
};
