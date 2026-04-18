"use client";

import { deleteShortLinkAction } from "@/app/(dashboard)/dashboard/short-links/actions";
import { CreateShortLinkForm } from "@/components/dashboard/short-links-content/create-short-link-form";
import { ShortLinkRow } from "@/components/dashboard/short-links-content/short-link-row";
import { SuccessToast } from "@/components/dashboard/short-links-content/success-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type ShortLinkItem = {
  createdAt: string;
  customSlug: null | string;
  expiresAt: null | string;
  id: string;
  passwordProtected: boolean;
  shortUrl: string;
  slug: string;
  url: string;
};

type ShortLinksContentProps = {
  /** The user's verified short domain (non-null only when configured AND
   *  verified). Custom slugs are only surfaceable via a user-owned short
   *  domain, so we gate the UI on the presence of this value and also use it
   *  as the prefix shown next to the custom-slug input. */
  customShortDomain: null | string;
  /** Pro-tier user; unlocks the UI even for auto-gen slugs. */
  isPro: boolean;
  /** Free-tier monthly cap. Rendered next to the current-month count for
   *  free users; ignored for Pro. */
  monthlyCap: number;
  shortLinks: ShortLinkItem[];
  /** Current user's count of short links created this UTC month. Drives the
   *  quota badge for free users; Pro users receive 0 and the badge is hidden. */
  usedThisMonth: number;
};

type SuccessMessage = {
  id: string;
  shortUrl: string;
};

export const ShortLinksContent: React.FC<ShortLinksContentProps> = (props) => {
  const { customShortDomain, isPro, monthlyCap, shortLinks: initialShortLinks, usedThisMonth: initialUsed } = props;

  //* State
  const { t } = useTranslation();
  const [shortLinks, setShortLinks] = React.useState(initialShortLinks);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [successMessages, setSuccessMessages] = React.useState<SuccessMessage[]>([]);
  // Track optimistically so the badge reflects newly-created links before the
  // server component re-renders.
  const [usedThisMonth, setUsedThisMonth] = React.useState(initialUsed);

  //* Variables
  const atCap = !isPro && usedThisMonth >= monthlyCap;
  const quotaBadge = !isPro ? (
    <Link
      aria-label={t("viewPricing")}
      className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors", {
        "bg-destructive/10 text-destructive hover:bg-destructive/15": atCap,
        "bg-muted text-muted-foreground hover:bg-muted/80": !atCap,
      })}
      href="/pricing"
    >
      {t("{{used}}Of{{total}}ShortUrlsThisMonth", { total: monthlyCap, used: usedThisMonth })}
    </Link>
  ) : null;

  //* Handlers
  const handleCreated = (shortLink: ShortLinkItem, keepOpen: boolean) => {
    setShortLinks((prev) => [shortLink, ...prev]);
    setSuccessMessages((prev) => [{ id: shortLink.id, shortUrl: shortLink.shortUrl }, ...prev]);
    if (!isPro) {
      setUsedThisMonth((prev) => prev + 1);
    }

    if (!keepOpen) {
      setModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteShortLinkAction(id);
    if (result.success) {
      setShortLinks((prev) => prev.filter((sl) => sl.id !== id));
      toast.success(t("shortLinkDeleted"));
    } else {
      toast.error(t("somethingWentWrong"));
    }
  };

  const dismissSuccess = (id: string) => {
    setSuccessMessages((prev) => prev.filter((m) => m.id !== id));
  };

  //* Effects
  React.useEffect(() => {
    setShortLinks(initialShortLinks);
  }, [initialShortLinks]);

  React.useEffect(() => {
    setUsedThisMonth(initialUsed);
  }, [initialUsed]);

  // ─── Empty State ──────────────────────────────────────────────────────────

  if (shortLinks.length === 0 && successMessages.length === 0) {
    return (
      <div className="space-y-4">
        {quotaBadge != null && <div className="flex justify-end">{quotaBadge}</div>}
        {successMessages.map((msg) => (
          <SuccessToast id={msg.id} key={msg.id} onDismiss={dismissSuccess} shortUrl={msg.shortUrl} />
        ))}
        <CreateShortLinkForm customShortDomain={customShortDomain} isPro={isPro} onCreated={handleCreated} />
      </div>
    );
  }

  // ─── List View ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {successMessages.map((msg) => (
        <SuccessToast id={msg.id} key={msg.id} onDismiss={dismissSuccess} shortUrl={msg.shortUrl} />
      ))}

      <div className="flex items-center justify-between gap-4">
        <Dialog onOpenChange={setModalOpen} open={modalOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 size-4" />
              {t("newShortLink")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("createShortLink")}</DialogTitle>
            </DialogHeader>
            <CreateShortLinkForm customShortDomain={customShortDomain} isPro={isPro} onCreated={handleCreated} />
          </DialogContent>
        </Dialog>
        {quotaBadge}
      </div>

      <div className="border-border overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border border-b">
              <th className="text-muted-foreground px-4 py-3 text-left font-medium">{t("shortUrl")}</th>
              <th className="text-muted-foreground px-4 py-3 text-left font-medium">{t("destination")}</th>
              <th className="text-muted-foreground px-4 py-3 text-left font-medium">{t("created")}</th>
              <th className="text-muted-foreground px-4 py-3 text-left font-medium">{t("expires")}</th>
              <th className="text-muted-foreground px-4 py-3 text-left font-medium">{t("status")}</th>
              <th className="text-muted-foreground px-4 py-3 text-right font-medium">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {shortLinks.map((sl) => (
              <ShortLinkRow key={sl.id} onDelete={handleDelete} shortLink={sl} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
