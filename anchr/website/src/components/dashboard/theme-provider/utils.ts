import { DARK_THEME_IDS, type ThemeId } from "@/lib/themes";

export const LS_MODE = "anchr-ui-mode";
export const LS_LIGHT = "anchr-light-theme";
export const LS_DARK = "anchr-dark-theme";
export const MEDIA = "(prefers-color-scheme: dark)";

export function readStorage<T extends string>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  return (localStorage.getItem(key) as T) ?? fallback;
}

export function applyToDom(themeId: ThemeId) {
  const d = document.documentElement;
  d.setAttribute("data-theme", themeId);
  d.style.colorScheme = DARK_THEME_IDS.has(themeId) ? "dark" : "light";
}

export function disableTransitions() {
  const css = document.createElement("style");
  css.appendChild(document.createTextNode("*,*::before,*::after{transition:none!important}"));
  document.head.appendChild(css);
  // Force reflow so the style is applied before removing
  (() => window.getComputedStyle(document.body))();
  // Wait one frame then remove
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.head.removeChild(css);
    });
  });
}
