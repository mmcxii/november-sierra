"use client";

import type { ThemeVariables } from "@/lib/custom-themes";
import { DARK_THEME_IDS, type ThemeId } from "@/lib/themes";
import { variablesToInlineStyle } from "@/lib/utils/custom-theme";
import * as React from "react";
import { LinkPageThemeContext, type PageMode } from "./context";
import { LS_KEY, MEDIA, readMode } from "./utils";

export type CustomThemeRenderData = {
  backgroundImage?: null | string;
  borderRadius?: null | number;
  font?: null | string;
  isDark?: boolean;
  overlayColor?: null | string;
  overlayOpacity?: null | number;
  rawCss?: null | string;
  variables: ThemeVariables;
};

export type ThemeProviderProps = React.PropsWithChildren<{
  darkCustomTheme?: CustomThemeRenderData;
  darkEnabled?: boolean;
  darkThemeId: string;
  lightCustomTheme?: CustomThemeRenderData;
  lightEnabled?: boolean;
  lightThemeId: string;
}>;

export const ThemeProvider: React.FC<ThemeProviderProps> = (props) => {
  const {
    children,
    darkCustomTheme,
    darkEnabled = true,
    darkThemeId,
    lightCustomTheme,
    lightEnabled = true,
    lightThemeId,
  } = props;

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

  // Light/dark toggle logic: force single mode if one is disabled
  let effectiveIsDark: boolean;
  if (!darkEnabled) {
    effectiveIsDark = false;
  } else if (!lightEnabled) {
    effectiveIsDark = true;
  } else {
    effectiveIsDark = mode === "dark" || (mode === "system" && systemDark);
  }

  const resolvedThemeId = effectiveIsDark ? darkThemeId : lightThemeId;
  const customTheme = effectiveIsDark ? darkCustomTheme : lightCustomTheme;
  const isCustom = customTheme != null;

  // For presets, use data-theme. For custom, use data-theme="custom-dark" or "custom-light".
  let dataTheme: ThemeId | string;
  if (isCustom) {
    dataTheme = effectiveIsDark ? "custom-dark" : "custom-light";
  } else {
    dataTheme = resolvedThemeId as ThemeId;
  }

  let colorScheme: string;
  if (isCustom) {
    colorScheme = effectiveIsDark ? "dark" : "light";
  } else {
    colorScheme = DARK_THEME_IDS.has(resolvedThemeId as ThemeId) ? "dark" : "light";
  }

  // Build inline styles for custom themes
  const customStyle: React.CSSProperties = React.useMemo(() => {
    if (!isCustom) {
      return { colorScheme };
    }

    const vars = variablesToInlineStyle(customTheme.variables);
    const style: Record<string, undefined | string> = {
      ...vars,
      colorScheme,
    };

    if (customTheme.borderRadius != null) {
      style["--anc-theme-border-radius"] = `${customTheme.borderRadius}px`;
    }

    if (customTheme.backgroundImage != null) {
      style.backgroundImage = `url(${customTheme.backgroundImage})`;
      style.backgroundSize = "cover";
      style.backgroundPosition = "center";
      style.backgroundAttachment = "fixed";
    }

    if (customTheme.font != null && customTheme.font.trim() !== "") {
      style.fontFamily = `"${customTheme.font}", var(--anc-font-sans)`;
    }

    return style as React.CSSProperties;
  }, [isCustom, customTheme, colorScheme]);

  const setMode = React.useCallback((m: PageMode) => {
    localStorage.setItem(LS_KEY, m);
    setModeState(m);
  }, []);

  const value = React.useMemo(() => ({ isDark: effectiveIsDark, mode, setMode }), [effectiveIsDark, mode, setMode]);

  // Listen for live preview messages from the Theme Studio (postMessage from parent iframe)
  const pageRootRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type !== "theme-studio-preview" || pageRootRef.current == null) {
        return;
      }

      const el = pageRootRef.current;
      const { variables: vars } = event.data as { type: string; variables: Record<string, string> };

      for (const [key, val] of Object.entries(vars)) {
        el.style.setProperty(key, val);
      }

      // Set data-theme so Tailwind dark: variant works
      el.setAttribute("data-theme", "custom-dark");
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Blocking FOUC-prevention script
  let isDarkExpression: string;
  if (!darkEnabled) {
    isDarkExpression = "false";
  } else if (!lightEnabled) {
    isDarkExpression = "true";
  } else {
    isDarkExpression = `m==="dark"||(m==="system"&&matchMedia("${MEDIA}").matches)`;
  }

  const themeScript = isCustom
    ? `(function(){try{var el=document.currentScript.parentElement;var m=localStorage.getItem("${LS_KEY}")||"system";var isDark=${isDarkExpression};el.setAttribute("data-theme",isDark?"custom-dark":"custom-light");el.style.colorScheme=isDark?"dark":"light"}catch(e){}})()`
    : `(function(){try{var el=document.currentScript.parentElement;var m=localStorage.getItem("${LS_KEY}")||"system";var isDark=${isDarkExpression};el.setAttribute("data-theme",isDark?"${darkThemeId}":"${lightThemeId}");el.style.colorScheme=isDark?"dark":"light"}catch(e){}})()`;

  return (
    <LinkPageThemeContext.Provider value={value}>
      <div
        className="lp-page-bg flex min-h-dvh flex-col"
        data-theme={dataTheme}
        ref={pageRootRef}
        // eslint-disable-next-line anchr/no-inline-style -- dynamic theme styles and color-scheme for browser chrome
        style={isCustom ? customStyle : { colorScheme }}
        suppressHydrationWarning
      >
        <script dangerouslySetInnerHTML={{ __html: themeScript }} suppressHydrationWarning />
        {/* Background image overlay */}
        {isCustom && customTheme.backgroundImage != null && (
          <div
            className="pointer-events-none fixed inset-0"
            // eslint-disable-next-line anchr/no-inline-style -- dynamic overlay
            style={{
              background: customTheme.overlayColor ?? "rgba(0,0,0,0.4)",
              opacity: customTheme.overlayOpacity ?? 0.4,
            }}
          />
        )}
        {/* Google Font link */}
        {isCustom && customTheme.font != null && customTheme.font.trim() !== "" && (
          <>
            <link href="https://fonts.googleapis.com" rel="preconnect" />
            <link crossOrigin="anonymous" href="https://fonts.gstatic.com" rel="preconnect" />
            <link
              href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(customTheme.font)}&display=swap`}
              rel="stylesheet"
            />
          </>
        )}
        {/* Custom CSS injection */}
        {isCustom && customTheme.rawCss != null && customTheme.rawCss.trim() !== "" && (
          <style dangerouslySetInnerHTML={{ __html: customTheme.rawCss }} />
        )}
        {children}
      </div>
    </LinkPageThemeContext.Provider>
  );
};
