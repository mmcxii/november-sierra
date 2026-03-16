import { type ThemeId } from "@/lib/themes";
import * as React from "react";

export type ThemeProviderProps = React.PropsWithChildren<{
  themeId: ThemeId;
}>;

export const ThemeProvider: React.FC<ThemeProviderProps> = (props) => {
  const { children, themeId } = props;

  return (
    <div className="lp-page-bg flex min-h-dvh flex-col" data-theme={themeId}>
      {children}
    </div>
  );
};
