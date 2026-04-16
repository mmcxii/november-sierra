"use client";

import { deleteShortLinkAction } from "@/app/(dashboard)/dashboard/short-links/actions";
import { CreateShortLinkForm } from "@/components/dashboard/short-links-content/create-short-link-form";
import { ShortLinkRow } from "@/components/dashboard/short-links-content/short-link-row";
import { SuccessToast } from "@/components/dashboard/short-links-content/success-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
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
  /** User-configured short domain (users.short_domain) — verified flag is
   *  passed via `hasCustomShortDomain` rather than the raw domain to keep the
   *  gating contract explicit. Custom slugs are only surfaceable via a
   *  user-owned short domain, so we gate the UI on the verified flag. */
  hasCustomShortDomain: boolean;
  /** Pro-tier user; unlocks the UI even for auto-gen slugs. */
  isPro: boolean;
  shortDomain: string;
  shortLinks: ShortLinkItem[];
};

type SuccessMessage = {
  id: string;
  shortUrl: string;
};

export const ShortLinksContent: React.FC<ShortLinksContentProps> = (props) => {
  const { hasCustomShortDomain, isPro, shortDomain, shortLinks: initialShortLinks } = props;

  //* State
  const { t } = useTranslation();
  const [shortLinks, setShortLinks] = React.useState(initialShortLinks);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [successMessages, setSuccessMessages] = React.useState<SuccessMessage[]>([]);

  //* Handlers
  const handleCreated = (shortLink: ShortLinkItem, keepOpen: boolean) => {
    setShortLinks((prev) => [shortLink, ...prev]);
    setSuccessMessages((prev) => [{ id: shortLink.id, shortUrl: shortLink.shortUrl }, ...prev]);

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

  // ─── Empty State ──────────────────────────────────────────────────────────

  if (shortLinks.length === 0 && successMessages.length === 0) {
    return (
      <div className="space-y-4">
        {successMessages.map((msg) => (
          <SuccessToast id={msg.id} key={msg.id} onDismiss={dismissSuccess} shortUrl={msg.shortUrl} />
        ))}
        <CreateShortLinkForm
          hasCustomShortDomain={hasCustomShortDomain}
          isPro={isPro}
          onCreated={handleCreated}
          shortDomain={shortDomain}
        />
      </div>
    );
  }

  // ─── List View ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {successMessages.map((msg) => (
        <SuccessToast id={msg.id} key={msg.id} onDismiss={dismissSuccess} shortUrl={msg.shortUrl} />
      ))}

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
          <CreateShortLinkForm
            hasCustomShortDomain={hasCustomShortDomain}
            isPro={isPro}
            onCreated={handleCreated}
            shortDomain={shortDomain}
          />
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left font-medium">{t("shortUrl")}</th>
              <th className="px-4 py-3 text-left font-medium">{t("destination")}</th>
              <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">{t("created")}</th>
              <th className="hidden px-4 py-3 text-left font-medium md:table-cell">{t("expires")}</th>
              <th className="px-4 py-3 text-left font-medium">{t("status")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("actions")}</th>
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
