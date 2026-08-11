"use client";

import { usePathname } from "next/navigation";
import * as React from "react";
import { isInternalNavAnchor, isSameDocumentUrl, navigationPendingContext } from "../utils";

export const NavigationPendingLinkListener: React.FC = () => {
  //* State
  const pathname = usePathname();
  const value = React.useContext(navigationPendingContext);

  //* Variables
  const startPending = value?.startPending;

  //* Effects
  React.useEffect(() => {
    if (startPending == null) {
      return;
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement) || !isInternalNavAnchor(anchor, event)) {
        return;
      }
      const href = anchor.getAttribute("href");
      if (href == null || isSameDocumentUrl(href, pathname, window.location.search)) {
        return;
      }
      startPending();
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
    };
  }, [pathname, startPending]);

  return null;
};
