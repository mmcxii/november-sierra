"use client";

import { deleteGroup } from "@/app/(dashboard)/dashboard/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type DeleteGroupDialogProps = {
  groupId: null | string;
  groupTitle: string;
  linkCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const DeleteGroupDialog: React.FC<DeleteGroupDialogProps> = (props) => {
  const { groupId, groupTitle, linkCount, onOpenChange, open } = props;

  //* State
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = React.useState(false);

  //* Handlers
  const handleDelete = async (deleteLinks: boolean) => {
    if (groupId == null) {
      return;
    }

    setIsDeleting(true);
    await deleteGroup(groupId, deleteLinks);
    setIsDeleting(false);
    onOpenChange(false);
  };

  const handleButtonOnClick = () => handleDelete(false);
  const handleDeleteLinksButtonOnClick = () => handleDelete(true);
  const handleDeleteGroupButtonOnClick = () => handleDelete(false);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteLinkGroup")}</DialogTitle>
          <DialogDescription>
            {t("areYouSureYouWantToDeleteThe{{title}}GroupThisActionCannotBeUndone", { title: groupTitle })}
          </DialogDescription>
        </DialogHeader>
        {linkCount > 0 && <p className="text-muted-foreground text-sm">{t("whatShouldHappenToTheLinksInThisGroup")}</p>}
        <DialogFooter className="sm:gap-2">
          {linkCount > 0 ? (
            <>
              <Button disabled={isDeleting} onClick={handleButtonOnClick} variant="secondary">
                {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
                {t("ungroupLinks")}
              </Button>
              <Button disabled={isDeleting} onClick={handleDeleteLinksButtonOnClick} variant="tertiary">
                {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
                {t("deleteLinksInGroup")}
              </Button>
            </>
          ) : (
            <Button disabled={isDeleting} onClick={handleDeleteGroupButtonOnClick} variant="tertiary">
              {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
              {t("delete")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
