"use client";

import * as React from "react";
import { navigationPendingContext } from "../utils";

export function useStartNavigationPending(): () => void {
  //* State
  const value = React.useContext(navigationPendingContext);

  return value?.startPending ?? (() => {});
}
