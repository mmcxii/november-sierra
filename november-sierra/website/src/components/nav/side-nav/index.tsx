"use client";

import { useActiveSection } from "@/hooks/use-active-section";
import { useTheme } from "@/hooks/use-theme";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

export const SideNav: React.FC = () => {
  //* State
  const activeSection = useActiveSection();
  const { mounted, theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  //* Variables
  const isForest = theme === "forest";
  const themeIcon = isForest ? <Sun size={14} /> : <Moon size={14} />;
  const themeIconMobile = isForest ? <Sun size={16} /> : <Moon size={16} />;
  const themeLabel = isForest ? t("light") : t("dark");
  const themeAriaLabel = t("switchTo{{theme}}Theme", { theme: isForest ? "fog" : "forest" });

  return (
    <>
      {/* Desktop: Full side nav with labels (xl+) */}
      <nav aria-label="Section navigation" className="fixed top-1/2 left-6 z-50 hidden -translate-y-1/2 xl:flex">
        <div className="border-ns-card-border bg-ns-nav-bg flex flex-col gap-1 rounded-lg border px-3 py-4 backdrop-blur-md">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;

            return (
              <a
                className={cn(
                  "nav-link relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200",
                  { "text-ns-nav-text font-normal": !isActive, "text-ns-nav-text-active font-semibold": isActive },
                )}
                href={`#${item.id}`}
                key={item.id}
              >
                <span
                  className={cn("h-1.5 w-1.5 rounded-full transition-all duration-200", {
                    "bg-ns-nav-indicator": isActive,
                    "bg-transparent": !isActive,
                  })}
                />
                {t(item.labelKey)}
              </a>
            );
          })}

          {mounted && (
            <>
              <div className="bg-ns-border my-2 h-px" />
              <button
                aria-label={themeAriaLabel}
                className="nav-link text-ns-nav-text flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-200"
                onClick={toggleTheme}
                type="button"
              >
                <span className="flex h-1.5 w-1.5 items-center justify-center">{themeIcon}</span>
                {themeLabel}
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Mobile/tablet: Floating vertical dots (below xl) */}
      <nav aria-label="Section navigation" className="fixed right-4 bottom-4 z-50 flex xl:hidden">
        <div className="border-ns-card-border bg-ns-nav-bg flex flex-col items-center gap-2 rounded-full border px-2.5 py-3 backdrop-blur-md">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;

            return (
              <a
                aria-label={t(item.labelKey)}
                className="block rounded-full p-1 transition-all duration-200"
                href={`#${item.id}`}
                key={item.id}
              >
                <span
                  className={cn("block rounded-full transition-all duration-200", {
                    "bg-ns-nav-indicator ring-ns-nav-indicator h-2.5 w-2.5 opacity-100 ring-2 ring-offset-2 ring-offset-transparent":
                      isActive,
                    "bg-ns-nav-text h-2 w-2 opacity-40": !isActive,
                  })}
                />
              </a>
            );
          })}

          {mounted && (
            <>
              <div className="bg-ns-border my-1 h-px w-4" />
              <button
                aria-label={themeAriaLabel}
                className="text-ns-nav-text rounded-full p-1 transition-colors duration-200"
                onClick={toggleTheme}
                type="button"
              >
                {themeIconMobile}
              </button>
            </>
          )}
        </div>
      </nav>
    </>
  );
};
