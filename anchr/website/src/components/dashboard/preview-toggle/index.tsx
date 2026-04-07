"use client";

import { PagePreview } from "@/components/dashboard/page-preview";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SessionUser } from "@/lib/auth";
import { ExternalLink, Eye } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type PreviewToggleProps = {
  previewKey?: string;
  user: SessionUser;
};

export const PreviewToggle: React.FC<PreviewToggleProps> = (props) => {
  const { previewKey, user } = props;

  //* State
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  //* Handlers
  const handleButtonOnClick = () => setOpen(true);

  const handleDialogContentOnOpenAutoFocus = (e: Event) => e.preventDefault();

  //* Effects
  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 1280px)");

    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setOpen(false);
      }
    };

    mql.addEventListener("change", handleChange);

    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return (
    <>
      <Button className="xl:hidden" onClick={handleButtonOnClick} size="sm" type="button" variant="secondary">
        <Eye className="size-4" />
        {t("preview")}
      </Button>

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent onOpenAutoFocus={handleDialogContentOnOpenAutoFocus}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{t("preview")}</DialogTitle>
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
            <DialogDescription className="sr-only">{t("viewLivePage")}</DialogDescription>
          </DialogHeader>
          <PagePreview hideHeader previewKey={previewKey} user={user} />
        </DialogContent>
      </Dialog>
    </>
  );
};
