import { ThemeToggle } from "@/components/theme-toggle";
import { Container } from "@/components/ui/container";
import * as React from "react";

export type AppChromeProps = React.PropsWithChildren;

export const AppChrome: React.FC<AppChromeProps> = (props) => {
  const { children } = props;

  return (
    <div className="relative min-h-dvh">
      <Container className="flex justify-end pt-4 md:pt-6">
        <ThemeToggle />
      </Container>
      {children}
    </div>
  );
};
