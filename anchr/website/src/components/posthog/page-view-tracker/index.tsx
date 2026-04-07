"use client";

import { posthogClient } from "@/lib/posthog";
import { usePathname, useSearchParams } from "next/navigation";
import * as React from "react";

export const PageViewTracker: React.FC = () => {
  //* State
  const pathname = usePathname();
  const searchParams = useSearchParams();

  //* Effects
  React.useEffect(() => {
    if (pathname != null && posthogClient) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + "?" + searchParams.toString();
      }
      posthogClient.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
};
