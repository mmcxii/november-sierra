"use client";

import { deleteLink, reorderLinks, toggleLinkVisibility } from "@/app/(dashboard)/dashboard/actions";
import { LinkForm } from "@/components/dashboard/link-form";
import { SortableLinkCard } from "@/components/dashboard/sortable-link-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { linksTable } from "@/lib/db/schema/link";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Link2, Loader2, Plus } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type LinkItem = typeof linksTable.$inferSelect;

export type LinkListProps = {
  links: LinkItem[];
};

export const LinkList: React.FC<LinkListProps> = (props) => {
  const { links } = props;

  //* State
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [dialogMode, setDialogMode] = React.useState<null | "add" | "edit">(null);
  const [dialogKey, setDialogKey] = React.useState(0);
  const [editingLink, setEditingLink] = React.useState<null | LinkItem>(null);
  const [deletingLink, setDeletingLink] = React.useState<null | LinkItem>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [orderedLinks, setOrderedLinks] = React.useState<LinkItem[]>(links);

  //* Handlers
  const handleOpenAdd = () => {
    setEditingLink(null);
    setDialogKey((k) => k + 1);
    setDialogMode("add");
  };

  const handleOpenEdit = (link: LinkItem) => {
    setEditingLink(link);
    setDialogKey((k) => k + 1);
    setDialogMode("edit");
  };

  const handleDialogSuccess = () => {
    setDialogMode(null);
  };

  const handleDialogCancel = () => {
    setDialogMode(null);
  };

  const handleOpenDelete = (link: LinkItem) => {
    setDeletingLink(link);
  };

  const handleConfirmDelete = async () => {
    if (deletingLink == null) {
      return;
    }

    setIsDeleting(true);
    await deleteLink(deletingLink.id);
    setIsDeleting(false);
    setDeletingLink(null);
  };

  const handleToggleVisibility = async (link: LinkItem) => {
    // Optimistic update
    setOrderedLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, visible: !l.visible } : l)));

    const result = await toggleLinkVisibility(link.id);

    if (result.success) {
      toast.success(
        link.visible
          ? t("{{title}}IsNowHidden", { title: link.title })
          : t("{{title}}IsNowVisible", { title: link.title }),
      );
    } else {
      // Revert on error
      setOrderedLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, visible: link.visible } : l)));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = orderedLinks.findIndex((l) => l.id === active.id);
    const newIndex = orderedLinks.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(orderedLinks, oldIndex, newIndex);

    // Optimistic update
    setOrderedLinks(reordered);

    const items = reordered.map((link, index) => ({ id: link.id, position: index }));
    await reorderLinks(items);
  };

  //* Effects
  React.useEffect(() => {
    setOrderedLinks(links);
  }, [links]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-lg font-semibold">{t("links")}</h1>
        <Button onClick={handleOpenAdd} size="sm" type="button" variant="primary">
          <Plus className="size-4" />
          {t("addLink")}
        </Button>
      </div>

      {/* Empty state */}
      {orderedLinks.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
          <div className="bg-muted flex size-14 items-center justify-center rounded-full">
            <Link2 className="text-muted-foreground size-6" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-medium">{t("noLinksYet")}</p>
            <p className="text-muted-foreground mt-1 text-sm">{t("addLinksToGetStarted")}</p>
          </div>
        </div>
      )}

      {/* Link list */}
      {orderedLinks.length > 0 && (
        <DndContext collisionDetection={closestCenter} id="link-list-dnd" onDragEnd={handleDragEnd} sensors={sensors}>
          <SortableContext items={orderedLinks.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-2">
              {orderedLinks.map((link) => (
                <SortableLinkCard
                  key={link.id}
                  link={link}
                  onDelete={handleOpenDelete}
                  onEdit={handleOpenEdit}
                  onToggleVisibility={handleToggleVisibility}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {/* Add / Edit Dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            handleDialogCancel();
          }
        }}
        open={dialogMode !== null}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLink != null ? t("editLink") : t("addLink")}</DialogTitle>
            <DialogDescription className="sr-only">
              {editingLink != null ? t("editLink") : t("addLink")}
            </DialogDescription>
          </DialogHeader>
          <LinkForm
            defaultValues={
              editingLink != null ? { id: editingLink.id, title: editingLink.title, url: editingLink.url } : undefined
            }
            key={dialogKey}
            onSuccess={handleDialogSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setDeletingLink(null);
          }
        }}
        open={deletingLink !== null}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteLink")}</DialogTitle>
            <DialogDescription>{t("areYouSureYouWantToDeleteThisLinkThisActionCannotBeUndone")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button disabled={isDeleting} onClick={handleConfirmDelete} variant="tertiary">
              {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
