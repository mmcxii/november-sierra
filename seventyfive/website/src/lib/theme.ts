export type ThemeMode = "dark" | "light" | "system";

export const THEME_STORAGE_KEY = "sf-theme";

export function applyTheme(mode: ThemeMode) {
  if (mode === "system") {
    document.documentElement.removeAttribute("data-theme");
    localStorage.removeItem(THEME_STORAGE_KEY);
    return;
  }
  document.documentElement.setAttribute("data-theme", mode);
  localStorage.setItem(THEME_STORAGE_KEY, mode);
}
