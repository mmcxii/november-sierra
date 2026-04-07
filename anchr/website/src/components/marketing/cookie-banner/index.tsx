"use client";

import { Container } from "@/components/ui/container";
import { posthogClient } from "@/lib/posthog";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { STORAGE_KEY, getServerSnapshot, getSnapshot, subscribe } from "./utils";

export const CookieBanner: React.FC = () => {
  const { t } = useTranslation();
  const consent = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const accept = React.useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    window.dispatchEvent(new StorageEvent("storage"));
  }, []);

  const reject = React.useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "rejected");
    posthogClient?.opt_out_capturing();
    window.dispatchEvent(new StorageEvent("storage"));
  }, []);

  if (consent != null) {
    return null;
  }

  return (
    <div className="m-page-bg-bg m-border-color-muted-15 fixed inset-x-0 bottom-0 z-50 border-t py-4">
      <Container className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="m-muted-70 text-sm">{t("weUseCookiesForAnalyticsToImproveYourExperience")}</p>
        <div className="flex items-center gap-3">
          <button
            className="m-muted-10-bg m-muted-60 cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-colors"
            onClick={reject}
            type="button"
          >
            {t("reject")}
          </button>
          <button
            className="m-accent-bg m-page-bg-color cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-colors"
            onClick={accept}
            type="button"
          >
            {t("accept")}
          </button>
        </div>
      </Container>
    </div>
  );
};
