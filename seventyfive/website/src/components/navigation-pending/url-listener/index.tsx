"use client";

import { usePathname, useSearchParams } from "next/navigation";
import * as React from "react";
import { navigationPendingContext } from "../utils";

export const NavigationPendingUrlListener: React.FC = () => {
  //* State
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = React.useContext(navigationPendingContext);

  //* Variables
  const search = searchParams.toString();
  const clearPending = value?.clearPending;

  //* Effects
  React.useEffect(() => {
    clearPending?.();
  }, [clearPending, pathname, search]);

  return null;
};
