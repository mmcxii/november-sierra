"use client";

import { DARK_THEME_IDS, type ThemeId } from "@/lib/themes";
import * as React from "react";
import { LinkPageThemeContext, type PageMode } from "./context";
import { LS_KEY, MEDIA, readMode } from "./utils";

export type ThemeProviderProps = React.PropsWithChildren<{
  darkThemeId: ThemeId;
  lightThemeId: ThemeId;
}>;

export const ThemeProvider: React.FC<ThemeProviderProps> = (props) => {
  const { children, darkThemeId, lightThemeId } = props;

  const [mode, setModeState] = React.useState<PageMode>("system");
  const [systemDark, setSystemDark] = React.useState(() =>
    typeof window !== "undefined" ? window.matchMedia(MEDIA).matches : true,
  );

  // Read stored preference before first browser paint
  React.useLayoutEffect(() => {
    setModeState(readMode());
  }, []);

  React.useEffect(() => {
    const mql = window.matchMedia(MEDIA);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const isDark = mode === "dark" || (mode === "system" && systemDark);
  const resolvedTheme: ThemeId = isDark ? darkThemeId : lightThemeId;

  const setMode = React.useCallback((m: PageMode) => {
    localStorage.setItem(LS_KEY, m);
    setModeState(m);
  }, []);

  const value = React.useMemo(() => ({ isDark, mode, setMode }), [isDark, mode, setMode]);

  // Blocking script that runs during HTML parsing, before React hydrates.
  // Sets data-theme on this div immediately so the browser never paints the wrong theme.
  const themeScript = `(function(){try{var el=document.currentScript.parentElement;var m=localStorage.getItem("${LS_KEY}")||"system";var isDark=m==="dark"||(m==="system"&&matchMedia("${MEDIA}").matches);el.setAttribute("data-theme",isDark?"${darkThemeId}":"${lightThemeId}");el.style.colorScheme=isDark?"dark":"light"}catch(e){}})()`;

  return (
    <LinkPageThemeContext.Provider value={value}>
      <div
        className="lp-page-bg flex min-h-dvh flex-col"
        data-theme={resolvedTheme}
        // eslint-disable-next-line anchr/no-inline-style -- dynamic color-scheme for browser chrome
        style={{ colorScheme: DARK_THEME_IDS.has(resolvedTheme) ? "dark" : "light" }}
        suppressHydrationWarning
      >
        <script dangerouslySetInnerHTML={{ __html: themeScript }} suppressHydrationWarning />
        {children}
      </div>
    </LinkPageThemeContext.Provider>
  );
};
