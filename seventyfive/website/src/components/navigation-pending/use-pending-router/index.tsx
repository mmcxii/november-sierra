"use client";

import { useRouter } from "next/navigation";
import { useStartNavigationPending } from "../use-start-navigation-pending";

export type PendingRouter = {
  back: () => void;
  push: (href: string) => void;
  refresh: () => void;
  replace: (href: string) => void;
};

export function usePendingRouter(): PendingRouter {
  //* State
  const router = useRouter();
  const startPending = useStartNavigationPending();

  //* Handlers
  const push = (href: string) => {
    startPending();
    router.push(href);
  };

  const replace = (href: string) => {
    startPending();
    router.replace(href);
  };

  const back = () => {
    startPending();
    router.back();
  };

  const refresh = () => {
    router.refresh();
  };

  return { back, push, refresh, replace };
}
