"use client";

import {
  bulkDeleteLinks,
  bulkUpdateVisibility,
  deleteLink,
  reorderLinks,
  toggleLinkVisibility,
} from "@/app/(dashboard)/dashboard/actions";
import { LinkForm } from "@/components/dashboard/link-form";
import { SortableLinkCard } from "@/components/dashboard/sortable-link-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Eye, EyeOff, Link2, Loader2, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type LinkItem = typeof linksTable.$inferSelect;

export type LinkListProps = {
  links: LinkItem[];
  username: string;
  onQrCode?: (link: LinkItem) => void;
};

export const LinkList: React.FC<LinkListProps> = (props) => {
  const { links, onQrCode, username } = props;

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
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = React.useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = React.useState(false);

  //* Variables
  const allSelected = orderedLinks.length > 0 && selectedIds.size === orderedLinks.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < orderedLinks.length;
  const allSelectedVisible =
    selectedIds.size > 0 && [...selectedIds].every((id) => orderedLinks.find((l) => l.id === id)?.visible);

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

  const handleSelectLink = (linkId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(linkId)) {
        next.delete(linkId);
      } else {
        next.add(linkId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orderedLinks.map((l) => l.id)));
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    setIsBulkDeleting(true);

    const result = await bulkDeleteLinks(ids);

    setIsBulkDeleting(false);
    setShowBulkDeleteDialog(false);

    if (result.success) {
      setSelectedIds(new Set());
      toast.success(t("{{count}}LinksDeleted", { count: ids.length }));
    }
  };

  const handleBulkVisibility = async (visible: boolean) => {
    const ids = [...selectedIds];
    setIsBulkUpdating(true);

    // Optimistic update
    setOrderedLinks((prev) => prev.map((l) => (ids.includes(l.id) ? { ...l, visible } : l)));

    const result = await bulkUpdateVisibility(ids, visible);

    setIsBulkUpdating(false);

    if (result.success) {
      setSelectedIds(new Set());
      toast.success(
        visible ? t("{{count}}LinksShown", { count: ids.length }) : t("{{count}}LinksHidden", { count: ids.length }),
      );
    } else {
      // Revert on error
      setOrderedLinks((prev) =>
        prev.map((l) => {
          const original = links.find((ol) => ol.id === l.id);
          return original != null ? { ...l, visible: original.visible } : l;
        }),
      );
    }
  };

  //* Effects
  React.useEffect(() => {
    setOrderedLinks(links);
  }, [links]);

  // Clear selection when links change (e.g. after bulk delete revalidation)
  React.useEffect(() => {
    setSelectedIds((prev) => {
      const currentIds = new Set(links.map((l) => l.id));
      const next = new Set([...prev].filter((id) => currentIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [links]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {orderedLinks.length > 0 && (
            <Checkbox
              aria-label={allSelected ? t("deselectAll") : t("selectAll")}
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onCheckedChange={handleSelectAll}
            />
          )}
          <h1 className="text-foreground text-lg font-semibold">{t("links")}</h1>
        </div>
        <Button onClick={handleOpenAdd} size="sm" type="button" variant="primary">
          <Plus className="size-4" />
          {t("addLink")}
        </Button>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-muted flex items-center gap-2 rounded-lg px-3 py-2">
          <span className="text-muted-foreground text-sm">{t("{{count}}Selected", { count: selectedIds.size })}</span>
          <div className="ml-auto flex items-center gap-1">
            <Button
              disabled={isBulkUpdating}
              onClick={() => handleBulkVisibility(!allSelectedVisible)}
              size="sm"
              type="button"
              variant="secondary"
            >
              {isBulkUpdating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : allSelectedVisible ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
              {allSelectedVisible ? t("hideSelected") : t("showSelected")}
            </Button>
            <Button
              disabled={isBulkDeleting}
              onClick={() => setShowBulkDeleteDialog(true)}
              size="sm"
              type="button"
              variant="tertiary"
            >
              <Trash2 className="size-3.5" />
              {t("deleteSelected")}
            </Button>
          </div>
        </div>
      )}

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
                  onQrCode={onQrCode}
                  onSelect={handleSelectLink}
                  onToggleVisibility={handleToggleVisibility}
                  selected={selectedIds.has(link.id)}
                  username={username}
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
              editingLink != null
                ? { id: editingLink.id, slug: editingLink.slug, title: editingLink.title, url: editingLink.url }
                : undefined
            }
            existingSlugs={orderedLinks.map((l) => l.slug)}
            key={dialogKey}
            onSuccess={handleDialogSuccess}
            username={username}
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

      {/* Bulk Delete Dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setShowBulkDeleteDialog(false);
          }
        }}
        open={showBulkDeleteDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteSelected")}</DialogTitle>
            <DialogDescription>
              {t("areYouSureYouWantToDelete{{count}}LinksThisActionCannotBeUndone", { count: selectedIds.size })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button disabled={isBulkDeleting} onClick={handleBulkDelete} variant="tertiary">
              {isBulkDeleting && <Loader2 className="size-3.5 animate-spin" />}
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
