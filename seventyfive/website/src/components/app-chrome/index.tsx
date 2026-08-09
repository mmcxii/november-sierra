import { ThemeToggle } from "@/components/theme-toggle";
import * as React from "react";

export type AppChromeProps = React.PropsWithChildren;

export const AppChrome: React.FC<AppChromeProps> = (props) => {
  const { children } = props;

  return (
    <div className="relative min-h-dvh">
      <div className="absolute top-4 right-4 z-20 md:top-6 md:right-6">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
};
