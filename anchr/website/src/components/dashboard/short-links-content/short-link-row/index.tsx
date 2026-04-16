"use client";

import type { ShortLinkItem } from "@/components/dashboard/short-links-content";
import { Button } from "@/components/ui/button";
import { Check, Copy, ExternalLink, Lock, Trash2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

type ShortLinkRowProps = {
  shortLink: ShortLinkItem;
  onDelete: (id: string) => void;
};

export const ShortLinkRow: React.FC<ShortLinkRowProps> = (props) => {
  const { onDelete, shortLink } = props;

  //* State
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);

  //* Variables
  const isExpired = shortLink.expiresAt != null && new Date(shortLink.expiresAt) < new Date();

  //* Handlers
  const handleCopy = async () => {
    await navigator.clipboard.writeText(shortLink.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (window.confirm(t("areYouSureYouWantToDeleteThisShortLink"))) {
      onDelete(shortLink.id);
    }
  };

  const relativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return t("today");
    }
    if (diffDays === 1) {
      return t("yesterday");
    }
    if (diffDays < 30) {
      return t("{{diffDays}}DAgo", { diffDays });
    }
    return date.toLocaleDateString();
  };

  return (
    <tr className="border-b last:border-b-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="font-mono text-sm">{shortLink.shortUrl.replace("https://", "")}</span>
          <button className="text-muted-foreground hover:text-foreground" onClick={handleCopy} type="button">
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
        </div>
      </td>
      <td className="max-w-[200px] truncate px-4 py-3" title={shortLink.url}>
        <a
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          href={shortLink.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="truncate">{shortLink.url}</span>
          <ExternalLink className="size-3 shrink-0" />
        </a>
      </td>
      <td className="text-muted-foreground hidden px-4 py-3 sm:table-cell">{relativeTime(shortLink.createdAt)}</td>
      <td className="text-muted-foreground hidden px-4 py-3 md:table-cell">
        {shortLink.expiresAt != null ? new Date(shortLink.expiresAt).toLocaleDateString() : t("never")}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {isExpired ? (
            <span className="bg-destructive/10 text-destructive rounded px-2 py-0.5 text-xs font-medium">
              {t("expired")}
            </span>
          ) : (
            <span className="bg-primary/10 text-primary rounded px-2 py-0.5 text-xs font-medium">{t("active")}</span>
          )}
          {shortLink.passwordProtected && <Lock className="text-muted-foreground size-3.5" />}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Button onClick={handleCopy} size="sm" title={t("copyShortUrl")} variant="tertiary">
            <Copy className="size-4" />
          </Button>
          <Button onClick={handleDelete} size="sm" title={t("delete")} variant="tertiary">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
};
