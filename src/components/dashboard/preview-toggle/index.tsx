"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type PreviewToggleProps = React.PropsWithChildren;

export const PreviewToggle: React.FC<PreviewToggleProps> = (props) => {
  const { children } = props;

  //* State
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button className="xl:hidden" onClick={() => setOpen(true)} size="sm" type="button" variant="secondary">
        <Eye className="size-4" />
        {t("preview")}
      </Button>

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("preview")}</DialogTitle>
            <DialogDescription className="sr-only">{t("viewLivePage")}</DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    </>
  );
};
