import type { CardTheme } from "@/components/dashboard/page-preview/utils";
import { getThemeStyle } from "@/components/dashboard/page-preview/utils";
import * as React from "react";

export type ThemeProviderProps = React.PropsWithChildren<{
  theme: CardTheme;
}>;

export const ThemeProvider: React.FC<ThemeProviderProps> = (props) => {
  const { children, theme } = props;

  //* Variables
  const style = { ...getThemeStyle(theme), background: theme.cardBg } as React.CSSProperties;

  return (
    // eslint-disable-next-line anchr/no-inline-style -- server-rendered theme CSS variables
    <div className="flex min-h-dvh flex-col" style={style}>
      {children}
    </div>
  );
};
