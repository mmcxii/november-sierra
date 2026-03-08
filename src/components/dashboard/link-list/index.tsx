"use client";

import { deleteLink } from "@/app/(dashboard)/dashboard/actions";
import type { linksTable } from "@/lib/db/schema/link";
import { ExternalLink, Link2, Pencil, Trash2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type LinkItem = typeof linksTable.$inferSelect;

export type LinkListProps = {
  links: LinkItem[];
};

export const LinkList: React.FC<LinkListProps> = (props) => {
  const { links } = props;

  //* State
  const { t } = useTranslation();
  const [deletingId, setDeletingId] = React.useState<null | string>(null);

  //* Handlers
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteLink(id);
    setDeletingId(null);
  };

  if (links.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
        <div className="bg-muted flex size-14 items-center justify-center rounded-full">
          <Link2 className="text-muted-foreground size-6" />
        </div>
        <div className="text-center">
          <p className="text-foreground font-medium">{t("noLinksYet")}</p>
          <p className="text-muted-foreground mt-1 text-sm">{t("addLinksToGetStarted")}</p>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {links.map((link) => (
        <li className="bg-card border-border flex items-center gap-4 rounded-lg border px-4 py-3" key={link.id}>
          <div className="min-w-0 flex-1">
            <p className="text-card-foreground truncate text-sm font-medium">{link.title}</p>
            <a
              className="text-muted-foreground flex items-center gap-1 truncate text-xs hover:underline"
              href={link.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              <ExternalLink className="size-3 shrink-0" />
              {link.url}
            </a>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              aria-label={t("editLink")}
              className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-2 transition-colors"
              type="button"
            >
              <Pencil className="size-4" />
            </button>
            <button
              aria-label={t("deleteLink")}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md p-2 transition-colors disabled:opacity-50"
              disabled={deletingId === link.id}
              onClick={() => handleDelete(link.id)}
              type="button"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};
