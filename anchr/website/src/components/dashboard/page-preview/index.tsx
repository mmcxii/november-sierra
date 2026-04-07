"use client";

import type { SessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { IFRAME_HEIGHT, IFRAME_WIDTH } from "./constants";

export type PagePreviewProps = {
  hideHeader?: boolean;
  previewKey?: string;
  user: SessionUser;
};

export const PagePreview: React.FC<PagePreviewProps> = (props) => {
  const { hideHeader, previewKey, user } = props;

  //* State
  const { t } = useTranslation();
  const [scale, setScale] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);

  //* Refs
  const containerRef = React.useRef<null | HTMLDivElement>(null);

  //* Variables
  const src = previewKey != null ? `/${user.username}?v=${encodeURIComponent(previewKey)}` : `/${user.username}`;

  //* Handlers
  const handleIframeOnLoad = () => setLoaded(true);

  //* Effects
  React.useEffect(() => {
    const el = containerRef.current;

    if (el == null) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 0;

      if (width > 0) {
        setScale(width / IFRAME_WIDTH);
      }
    });

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    setLoaded(false);
  }, [previewKey]);

  return (
    <div className="flex flex-col gap-3">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-sm font-semibold">{t("preview")}</h2>
          <a
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
            href={`/${user.username}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink className="size-3" />
            {t("viewLivePage")}
          </a>
        </div>
      )}

      <div
        className="border-border overflow-hidden rounded-xl border"
        ref={containerRef}
        // eslint-disable-next-line anchr/no-inline-style -- dynamic runtime value
        style={{ height: scale > 0 ? IFRAME_HEIGHT * scale : undefined }}
      >
        {scale > 0 && (
          <iframe
            className={cn("pointer-events-none origin-top-left transition-opacity duration-300", {
              "opacity-0": !loaded,
            })}
            height={IFRAME_HEIGHT}
            onLoad={handleIframeOnLoad}
            src={src}
            // eslint-disable-next-line anchr/no-inline-style -- dynamic runtime value
            style={{ transform: `scale(${scale})` }}
            tabIndex={-1}
            title={t("preview")}
            width={IFRAME_WIDTH}
          />
        )}
      </div>
    </div>
  );
};
