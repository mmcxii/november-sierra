"use client";

import { BrandPulse } from "@/components/brand-pulse";
import * as React from "react";

export const NavigationPendingOverlay: React.FC = () => {
  return (
    <div aria-busy="true" className="sf-nav-pending">
      <BrandPulse size="sm" />
    </div>
  );
};
