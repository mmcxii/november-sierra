/**
 * Blocking inline script for FOUC-free dashboard theme initialization.
 * Runs before first paint to set `data-theme` and `color-scheme` on <html>.
 *
 * localStorage keys:
 *   anchr-ui-mode        → "system" | "light" | "dark"   (default: "system")
 *   anchr-light-theme    → "stateroom" | "seafoam"       (default: "stateroom")
 *   anchr-dark-theme     → "dark-depths" | "obsidian"    (default: "dark-depths")
 */
export const THEME_SCRIPT = `(function(){try{var d=document.documentElement;var s=localStorage;var m=s.getItem("anchr-ui-mode")||"system";var isDark=m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme:dark)").matches);var t=isDark?s.getItem("anchr-dark-theme")||"dark-depths":s.getItem("anchr-light-theme")||"stateroom";d.setAttribute("data-theme",t);d.style.colorScheme=isDark?"dark":"light"}catch(e){}})()`;
