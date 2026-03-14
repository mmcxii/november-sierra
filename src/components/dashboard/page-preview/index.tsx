"use client";

import type { LinkItem } from "@/components/dashboard/link-list";
import type { SessionUser } from "@/lib/auth";
import { Anchor, ExternalLink, Link2 } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { applyThemeProperties, getCardTheme } from "./utils";

export type PagePreviewProps = {
  links: LinkItem[];
  user: SessionUser;
};

export const PagePreview: React.FC<PagePreviewProps> = (props) => {
  const { links, user } = props;

  //* State
  const { t } = useTranslation();

  //* Variables
  const theme = getCardTheme(user.theme);
  const visibleLinks = links.filter((l) => l.visible);
  const initials = (user.displayName ?? user.username).slice(0, 2).toUpperCase();

  //* Handlers
  const themeRef = React.useCallback(
    (el: null | HTMLDivElement) => {
      if (el == null) {
        return;
      }
      applyThemeProperties(el, theme);
    },
    [theme],
  );

  return (
    <div className="flex flex-col gap-3">
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

      {/* Preview card */}
      <div className="border-border overflow-hidden rounded-xl border" ref={themeRef}>
        <div className="mc-front relative overflow-hidden rounded-xl">
          {/* Hairline accent */}
          <div className="mc-hairline absolute inset-x-0 top-0 h-px" />

          {/* Radial glow */}
          <div className="mc-glow pointer-events-none absolute top-0 left-1/2 h-24 w-40 -translate-x-1/2 rounded-full opacity-25 blur-2xl" />

          <div className="relative flex flex-col px-4 pt-5 pb-4">
            {/* Avatar */}
            <div className="mb-3 flex flex-col items-center">
              <div className="relative mb-2">
                <div className="mc-avatar-outer flex size-14 items-center justify-center rounded-full">
                  <div className="mc-avatar-inner flex size-11 items-center justify-center rounded-full">
                    {user.avatarUrl != null ? (
                      <Image
                        alt={user.displayName ?? user.username}
                        className="size-11 rounded-full object-cover"
                        height={44}
                        src={user.avatarUrl}
                        width={44}
                      />
                    ) : (
                      <span className="mc-anchor-color text-xs font-bold">{initials}</span>
                    )}
                  </div>
                </div>
              </div>
              <p className="mc-name-color text-xs font-bold tracking-wide">{user.displayName ?? user.username}</p>
              <p className="mc-link-text mt-0.5 text-[9px] font-medium tracking-[0.2em] uppercase">@{user.username}</p>
            </div>

            {/* Links */}
            {visibleLinks.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {visibleLinks.map((link) => (
                  <div className="mc-link flex items-center gap-2 rounded-lg px-3 py-2" key={link.id}>
                    <div className="mc-link-icon-bg flex size-5 shrink-0 items-center justify-center rounded-md">
                      <Link2 className="mc-link-icon-color size-3" strokeWidth={1.75} />
                    </div>
                    <span className="mc-link-text flex-1 truncate text-center text-[10px] font-medium">
                      {link.title}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 py-4">
                <p className="mc-link-text text-[10px]">{t("noLinksYet")}</p>
              </div>
            )}

            {/* Branding */}
            <div className="mc-branding mt-auto flex items-center justify-center gap-1.5 pt-3">
              <Anchor className="mc-brand-color size-2.5" strokeWidth={1.5} />
              <span className="mc-brand-color text-[8px] font-bold tracking-[0.25em] uppercase">Anchr</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
