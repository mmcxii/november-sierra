import * as React from "react";

export const PENDING_TIMEOUT_MS = 12_000;

export type NavigationPendingContextValue = {
  clearPending: () => void;
  startPending: () => void;
};

export const navigationPendingContext = React.createContext<null | NavigationPendingContextValue>(null);

export function isInternalNavAnchor(anchor: HTMLAnchorElement, event: MouseEvent): boolean {
  if (event.defaultPrevented || event.button !== 0) {
    return false;
  }
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  if (anchor.target !== "" && anchor.target !== "_self") {
    return false;
  }
  if (anchor.hasAttribute("download")) {
    return false;
  }

  const href = anchor.getAttribute("href");
  if (href == null || href === "" || href.startsWith("#")) {
    return false;
  }
  if (href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }

  try {
    const url = new URL(href, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

export function isSameDocumentUrl(href: string, pathname: string, search: string): boolean {
  try {
    const url = new URL(href, window.location.origin);
    return url.pathname === pathname && url.search === search;
  } catch {
    return true;
  }
}
