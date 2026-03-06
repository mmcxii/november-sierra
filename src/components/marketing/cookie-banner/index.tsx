"use client";

import { posthogClient } from "@/lib/posthog";
import { useCallback, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "cookie-consent";

function getSnapshot(): null | string {
  return localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot(): null | string {
  return "pending";
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export const CookieBanner: React.FC = () => {
  const { t } = useTranslation();
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const accept = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    window.dispatchEvent(new StorageEvent("storage"));
  }, []);

  const reject = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "rejected");
    posthogClient?.opt_out_capturing();
    window.dispatchEvent(new StorageEvent("storage"));
  }, []);

  if (consent) {
    return null;
  }

  return (
    <div className="m-page-bg-bg m-border-color-muted-15 fixed inset-x-0 bottom-0 z-50 border-t px-6 py-4">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="m-muted-70 text-sm">{t("cookieBannerMessage")}</p>
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
      </div>
    </div>
  );
};
