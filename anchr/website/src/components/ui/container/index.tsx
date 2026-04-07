import { cn } from "@/lib/utils";
import * as React from "react";

export type ContainerProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
};

export const Container: React.FC<ContainerProps> = (props) => {
  const { as: Component = "div", className, ...rest } = props;

  return <Component className={cn("mx-auto w-full px-5 sm:px-6 md:px-8 lg:px-10 xl:max-w-6xl", className)} {...rest} />;
};
