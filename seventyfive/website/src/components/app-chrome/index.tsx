import { ThemeToggle } from "@/components/theme-toggle";
import * as React from "react";

export type AppChromeProps = React.PropsWithChildren;

export const AppChrome: React.FC<AppChromeProps> = (props) => {
  const { children } = props;

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div className="absolute top-4 right-5 z-10 sm:right-6 md:top-6">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
};
