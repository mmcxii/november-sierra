import type { PageMode } from "./context";

export const LS_KEY = "anchr-page-mode";
export const MEDIA = "(prefers-color-scheme: dark)";

export function readMode(): PageMode {
  if (typeof window === "undefined") {
    return "system";
  }
  return (localStorage.getItem(LS_KEY) as PageMode) ?? "system";
}
