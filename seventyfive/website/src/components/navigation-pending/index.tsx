"use client";

import * as React from "react";
import { NavigationPendingLinkListener } from "./link-listener";
import { NavigationPendingOverlay } from "./overlay";
import { NavigationPendingUrlListener } from "./url-listener";
import { PENDING_TIMEOUT_MS, navigationPendingContext } from "./utils";

export type NavigationPendingProviderProps = React.PropsWithChildren;

export type { PendingRouter } from "./use-pending-router";
export { usePendingRouter } from "./use-pending-router";
export { useStartNavigationPending } from "./use-start-navigation-pending";

export const NavigationPendingProvider: React.FC<NavigationPendingProviderProps> = (props) => {
  const { children } = props;

  //* State
  const [pending, setPending] = React.useState(false);

  //* Refs
  const timeoutRef = React.useRef<null | number>(null);

  //* Handlers
  const clearPending = React.useCallback(() => {
    setPending(false);
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startPending = React.useCallback(() => {
    setPending(true);
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setPending(false);
      timeoutRef.current = null;
    }, PENDING_TIMEOUT_MS);
  }, []);

  //* Effects
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <navigationPendingContext.Provider value={{ clearPending, startPending }}>
      {children}
      <React.Suspense fallback={null}>
        <NavigationPendingUrlListener />
      </React.Suspense>
      <NavigationPendingLinkListener />
      {pending ? <NavigationPendingOverlay /> : null}
    </navigationPendingContext.Provider>
  );
};
