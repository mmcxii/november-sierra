"use client";

import {
  bulkDeleteLinks,
  bulkUpdateVisibility,
  deleteLink,
  reorderGroups,
  reorderLinks,
  toggleFeaturedLink,
  toggleGroupVisibility,
  toggleLinkVisibility,
  updateLinkGroup,
} from "@/app/(dashboard)/dashboard/actions";
import { DeleteGroupDialog } from "@/components/dashboard/delete-group-dialog";
import { GroupForm } from "@/components/dashboard/group-form";
import { LinkForm } from "@/components/dashboard/link-form";
import { QuickLinksSection } from "@/components/dashboard/quick-links-section";
import { SortableGroup } from "@/components/dashboard/sortable-group";
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
import type { linkGroupsTable } from "@/lib/db/schema/link-group";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  type UniqueIdentifier,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Eye, EyeOff, FolderPlus, Link2, Loader2, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { resolveCheckboxState } from "./utils";

export type GroupItem = typeof linkGroupsTable.$inferSelect;
export type LinkItem = typeof linksTable.$inferSelect;

export type LinkListProps = {
  customDomain?: null | string;
  groups: GroupItem[];
  isPro: boolean;
  links: LinkItem[];
  username: string;
  onQrCode?: (link: LinkItem) => void;
};

export const LinkList: React.FC<LinkListProps> = (props) => {
  const { customDomain, groups: initialGroups, isPro, links, onQrCode, username } = props;

  //* State
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const { setNodeRef: setUngroupedDropRef } = useDroppable({ id: "group-drop:ungrouped" });
  const [linkDialogMode, setLinkDialogMode] = React.useState<null | "add" | "edit">(null);
  const [linkDialogKey, setLinkDialogKey] = React.useState(0);
  const [editingLink, setEditingLink] = React.useState<null | LinkItem>(null);
  const [deletingLink, setDeletingLink] = React.useState<null | LinkItem>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [orderedLinks, setOrderedLinks] = React.useState<LinkItem[]>(links);
  const [orderedGroups, setOrderedGroups] = React.useState<GroupItem[]>(initialGroups);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = React.useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = React.useState(false);
  const [groupDialogMode, setGroupDialogMode] = React.useState<null | "add" | "edit">(null);
  const [groupDialogKey, setGroupDialogKey] = React.useState(0);
  const [editingGroup, setEditingGroup] = React.useState<null | GroupItem>(null);
  const [deletingGroup, setDeletingGroup] = React.useState<null | GroupItem>(null);
  const [activeDragId, setActiveDragId] = React.useState<null | UniqueIdentifier>(null);

  //* Variables
  const quickLinksGroup = orderedGroups.find((g) => g.isQuickLinks) ?? null;
  const regularGroups = orderedGroups.filter((g) => !g.isQuickLinks);
  const featuredLink = isPro ? (orderedLinks.find((l) => l.isFeatured) ?? null) : null;
  const ungroupedLinks = orderedLinks.filter((l) => l.groupId == null && !l.isFeatured);
  const allSelected = orderedLinks.length > 0 && selectedIds.size === orderedLinks.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < orderedLinks.length;
  const allSelectedVisible =
    selectedIds.size > 0 && [...selectedIds].every((id) => orderedLinks.find((l) => l.id === id)?.visible);

  const groupLinkCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const link of orderedLinks) {
      if (link.groupId != null) {
        counts[link.groupId] = (counts[link.groupId] ?? 0) + 1;
      }
    }
    return counts;
  }, [orderedLinks]);

  //* Handlers
  const handleOpenAddLink = () => {
    setEditingLink(null);
    setLinkDialogKey((k) => k + 1);
    setLinkDialogMode("add");
  };

  const handleOpenEditLink = (link: LinkItem) => {
    setEditingLink(link);
    setLinkDialogKey((k) => k + 1);
    setLinkDialogMode("edit");
  };

  const handleLinkDialogSuccess = () => {
    setLinkDialogMode(null);
  };

  const handleLinkDialogCancel = () => {
    setLinkDialogMode(null);
  };

  const handleOpenDeleteLink = (link: LinkItem) => {
    setDeletingLink(link);
  };

  const handleConfirmDeleteLink = async () => {
    if (deletingLink == null) {
      return;
    }

    setIsDeleting(true);
    await deleteLink(deletingLink.id);
    setIsDeleting(false);
    setDeletingLink(null);
  };

  const handleToggleLinkVisibility = async (link: LinkItem) => {
    setOrderedLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, visible: !l.visible } : l)));

    const result = await toggleLinkVisibility(link.id);

    if (result.success) {
      toast.success(
        link.visible
          ? t("{{title}}IsNowHidden", { title: link.title })
          : t("{{title}}IsNowVisible", { title: link.title }),
      );
    } else {
      setOrderedLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, visible: link.visible } : l)));
    }
  };

  const handleToggleFeatured = async (link: LinkItem) => {
    const wasFeatured = link.isFeatured;

    setOrderedLinks((prev) =>
      prev.map((l) => {
        if (l.id === link.id) {
          return { ...l, isFeatured: !wasFeatured };
        }
        return wasFeatured ? l : { ...l, isFeatured: false };
      }),
    );

    const result = await toggleFeaturedLink(link.id);

    if (result.success) {
      toast.success(
        wasFeatured
          ? t("{{title}}IsNoLongerFeatured", { title: link.title })
          : t("{{title}}IsNowFeatured", { title: link.title }),
      );
    } else {
      setOrderedLinks((prev) =>
        prev.map((l) => {
          const original = links.find((ol) => ol.id === l.id);
          return original != null ? { ...l, isFeatured: original.isFeatured } : l;
        }),
      );
    }
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

    setOrderedLinks((prev) => prev.map((l) => (ids.includes(l.id) ? { ...l, visible } : l)));

    const result = await bulkUpdateVisibility(ids, visible);

    setIsBulkUpdating(false);

    if (result.success) {
      setSelectedIds(new Set());
      toast.success(
        visible ? t("{{count}}LinksShown", { count: ids.length }) : t("{{count}}LinksHidden", { count: ids.length }),
      );
    } else {
      setOrderedLinks((prev) =>
        prev.map((l) => {
          const original = links.find((ol) => ol.id === l.id);
          return original != null ? { ...l, visible: original.visible } : l;
        }),
      );
    }
  };

  // Groups
  const handleOpenAddGroup = () => {
    setEditingGroup(null);
    setGroupDialogKey((k) => k + 1);
    setGroupDialogMode("add");
  };

  const handleOpenEditGroup = (group: GroupItem) => {
    setEditingGroup(group);
    setGroupDialogKey((k) => k + 1);
    setGroupDialogMode("edit");
  };

  const handleGroupDialogSuccess = () => {
    setGroupDialogMode(null);
  };

  const handleGroupDialogCancel = () => {
    setGroupDialogMode(null);
  };

  const handleOpenDeleteGroup = (group: GroupItem) => {
    setDeletingGroup(group);
  };

  const handleToggleGroupVisibility = async (group: GroupItem) => {
    setOrderedGroups((prev) => prev.map((g) => (g.id === group.id ? { ...g, visible: !g.visible } : g)));

    const result = await toggleGroupVisibility(group.id);

    if (result.success) {
      toast.success(
        group.visible
          ? t("{{title}}IsNowHidden", { title: group.title })
          : t("{{title}}IsNowVisible", { title: group.title }),
      );
    } else {
      setOrderedGroups((prev) => prev.map((g) => (g.id === group.id ? { ...g, visible: group.visible } : g)));
    }
  };

  // Bulk actions
  const handleBulkVisibilityButtonOnClick = () => handleBulkVisibility(!allSelectedVisible);

  const handleBulkDeleteButtonOnClick = () => setShowBulkDeleteDialog(true);

  // Dialog open-change handlers
  const handleLinkDialogOnOpenChange = (open: boolean) => {
    if (!open) {
      handleLinkDialogCancel();
    }
  };

  const handleDeleteLinkDialogOnOpenChange = (open: boolean) => {
    if (!open) {
      setDeletingLink(null);
    }
  };

  const handleBulkDeleteDialogOnOpenChange = (open: boolean) => {
    if (!open) {
      setShowBulkDeleteDialog(false);
    }
  };

  const handleGroupDialogOnOpenChange = (open: boolean) => {
    if (!open) {
      handleGroupDialogCancel();
    }
  };

  const handleDeleteGroupDialogOnOpenChange = (open: boolean) => {
    if (!open) {
      setDeletingGroup(null);
    }
  };

  // DnD
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (over == null) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    // ─── Group reordering (regular groups only, Quick Links excluded) ─
    if (activeId.startsWith("group:") && overId.startsWith("group:")) {
      const activeGroupId = activeId.replace("group:", "");
      const overGroupId = overId.replace("group:", "");

      if (activeGroupId === overGroupId) {
        return;
      }

      const oldIndex = regularGroups.findIndex((g) => g.id === activeGroupId);
      const newIndex = regularGroups.findIndex((g) => g.id === overGroupId);
      const reordered = arrayMove(regularGroups, oldIndex, newIndex);

      setOrderedGroups((prev) => {
        const ql = prev.filter((g) => g.isQuickLinks);
        return [...ql, ...reordered];
      });

      const items = reordered.map((g, i) => ({ id: g.id, position: i }));
      await reorderGroups(items);
      return;
    }

    // ─── Link reordering / cross-container ───────────────────────────
    if (activeId.startsWith("group:")) {
      return;
    }

    const activeLink = orderedLinks.find((l) => l.id === activeId);
    if (activeLink == null) {
      return;
    }

    // Determine target container from where we dropped
    let targetGroupId: null | string = activeLink.groupId;

    if (overId.startsWith("group-drop:")) {
      const groupIdPart = overId.replace("group-drop:", "");
      targetGroupId = groupIdPart === "ungrouped" ? null : groupIdPart;
    } else if (overId.startsWith("group:")) {
      targetGroupId = overId.replace("group:", "");
    } else {
      const overLink = orderedLinks.find((l) => l.id === overId);
      if (overLink != null) {
        targetGroupId = overLink.groupId ?? null;
      }
    }

    const currentGroupId = activeLink.groupId ?? null;
    const isCrossContainer = targetGroupId !== currentGroupId;

    if (isCrossContainer) {
      // Cross-container move: update groupId optimistically + on server
      setOrderedLinks((prev) => prev.map((l) => (l.id === activeId ? { ...l, groupId: targetGroupId } : l)));
      await updateLinkGroup(activeId, targetGroupId);
    } else if (!overId.startsWith("group-drop:") && !overId.startsWith("group:")) {
      // Same-container reorder
      const containerLinks = orderedLinks.filter((l) => (l.groupId ?? null) === targetGroupId);
      const oldIndex = containerLinks.findIndex((l) => l.id === activeId);
      const newIndex = containerLinks.findIndex((l) => l.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reorderedContainer = arrayMove(containerLinks, oldIndex, newIndex);

        setOrderedLinks((prev) => {
          const next = [...prev];
          for (const [i, link] of reorderedContainer.entries()) {
            const idx = next.findIndex((l) => l.id === link.id);
            if (idx !== -1) {
              next[idx] = { ...next[idx], position: i };
            }
          }
          return next;
        });

        const items = reorderedContainer.map((link, index) => ({ id: link.id, position: index }));
        await reorderLinks(items);
      }
    }
  };

  //* Effects
  React.useEffect(() => {
    setOrderedLinks(links);
  }, [links]);

  React.useEffect(() => {
    setOrderedGroups(initialGroups);
  }, [initialGroups]);

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
              checked={resolveCheckboxState(allSelected, someSelected)}
              onCheckedChange={handleSelectAll}
            />
          )}
          <h1 className="text-foreground text-lg font-semibold">{t("links")}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isPro && (
            <Button onClick={handleOpenAddGroup} size="sm" type="button" variant="secondary">
              <FolderPlus className="size-4" />
              {t("addLinkGroup")}
            </Button>
          )}
          <Button onClick={handleOpenAddLink} size="sm" type="button" variant="primary">
            <Plus className="size-4" />
            {t("addLink")}
          </Button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-muted flex items-center gap-2 rounded-lg px-3 py-2">
          <span className="text-muted-foreground text-sm">{t("{{count}}Selected", { count: selectedIds.size })}</span>
          <div className="ml-auto flex items-center gap-1">
            <Button
              disabled={isBulkUpdating}
              onClick={handleBulkVisibilityButtonOnClick}
              size="sm"
              type="button"
              variant="secondary"
            >
              {isBulkUpdating && <Loader2 className="size-3.5 animate-spin" />}
              {!isBulkUpdating && allSelectedVisible && <EyeOff className="size-3.5" />}
              {!isBulkUpdating && !allSelectedVisible && <Eye className="size-3.5" />}
              {allSelectedVisible ? t("hideSelected") : t("showSelected")}
            </Button>
            <Button
              disabled={isBulkDeleting}
              onClick={handleBulkDeleteButtonOnClick}
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
      {orderedLinks.length === 0 && orderedGroups.length === 0 && (
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

      {/* Link & Group list with DnD */}
      {(orderedLinks.length > 0 || orderedGroups.length > 0) && (
        <DndContext
          collisionDetection={pointerWithin}
          id="link-list-dnd"
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          sensors={sensors}
        >
          <div className="flex flex-col gap-4">
            {/* Quick Links section */}
            {quickLinksGroup != null && (
              <QuickLinksSection
                customDomain={customDomain}
                group={quickLinksGroup}
                links={orderedLinks
                  .filter((l) => l.groupId === quickLinksGroup.id && !l.isFeatured)
                  .sort((a, b) => a.position - b.position)}
                onDeleteLink={handleOpenDeleteLink}
                onEditLink={handleOpenEditLink}
                onQrCode={onQrCode}
                onSelectLink={handleSelectLink}
                onToggleFeatured={isPro ? handleToggleFeatured : undefined}
                onToggleGroupVisibility={handleToggleGroupVisibility}
                onToggleLinkVisibility={handleToggleLinkVisibility}
                selectedIds={selectedIds}
                username={username}
              />
            )}

            {/* Featured link (hoisted) */}
            {featuredLink != null && (
              <ul className="flex flex-col gap-2">
                <SortableLinkCard
                  customDomain={customDomain}
                  key={featuredLink.id}
                  link={featuredLink}
                  onDelete={handleOpenDeleteLink}
                  onEdit={handleOpenEditLink}
                  onQrCode={onQrCode}
                  onSelect={handleSelectLink}
                  onToggleFeatured={handleToggleFeatured}
                  onToggleVisibility={handleToggleLinkVisibility}
                  selected={selectedIds.has(featuredLink.id)}
                  username={username}
                />
              </ul>
            )}

            {/* Ungrouped links */}
            <div ref={setUngroupedDropRef}>
              <SortableContext items={ungroupedLinks.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                {ungroupedLinks.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {ungroupedLinks.map((link) => (
                      <SortableLinkCard
                        customDomain={customDomain}
                        key={link.id}
                        link={link}
                        onDelete={handleOpenDeleteLink}
                        onEdit={handleOpenEditLink}
                        onQrCode={onQrCode}
                        onSelect={handleSelectLink}
                        onToggleFeatured={isPro ? handleToggleFeatured : undefined}
                        onToggleVisibility={handleToggleLinkVisibility}
                        selected={selectedIds.has(link.id)}
                        username={username}
                      />
                    ))}
                  </ul>
                )}
              </SortableContext>
            </div>

            {/* Groups */}
            <SortableContext items={regularGroups.map((g) => `group:${g.id}`)} strategy={verticalListSortingStrategy}>
              {regularGroups.map((group) => {
                const groupLinks = orderedLinks
                  .filter((l) => l.groupId === group.id && !l.isFeatured)
                  .sort((a, b) => a.position - b.position);

                return (
                  <SortableGroup
                    customDomain={customDomain}
                    group={group}
                    key={group.id}
                    links={groupLinks}
                    onDeleteGroup={handleOpenDeleteGroup}
                    onDeleteLink={handleOpenDeleteLink}
                    onEditGroup={handleOpenEditGroup}
                    onEditLink={handleOpenEditLink}
                    onQrCode={onQrCode}
                    onSelectLink={handleSelectLink}
                    onToggleFeatured={isPro ? handleToggleFeatured : undefined}
                    onToggleGroupVisibility={handleToggleGroupVisibility}
                    onToggleLinkVisibility={handleToggleLinkVisibility}
                    selectedIds={selectedIds}
                    username={username}
                  />
                );
              })}
            </SortableContext>
          </div>
          <DragOverlay>
            {activeDragId != null &&
              !String(activeDragId).startsWith("group:") &&
              (() => {
                const draggedLink = orderedLinks.find((l) => l.id === activeDragId);
                if (draggedLink == null) {
                  return null;
                }
                return (
                  <SortableLinkCard
                    customDomain={customDomain}
                    link={draggedLink}
                    onDelete={handleOpenDeleteLink}
                    onEdit={handleOpenEditLink}
                    onQrCode={onQrCode}
                    onSelect={handleSelectLink}
                    onToggleFeatured={isPro ? handleToggleFeatured : undefined}
                    onToggleVisibility={handleToggleLinkVisibility}
                    selected={selectedIds.has(draggedLink.id)}
                    username={username}
                  />
                );
              })()}
          </DragOverlay>
        </DndContext>
      )}

      {/* Add / Edit Link Dialog */}
      <Dialog onOpenChange={handleLinkDialogOnOpenChange} open={linkDialogMode !== null}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLink != null ? t("editLink") : t("addLink")}</DialogTitle>
            <DialogDescription className="sr-only">
              {editingLink != null ? t("editLink") : t("addLink")}
            </DialogDescription>
          </DialogHeader>
          <LinkForm
            customDomain={customDomain}
            defaultValues={
              editingLink != null
                ? {
                    copyValue: editingLink.copyValue,
                    groupId: editingLink.groupId ?? "",
                    icon: editingLink.icon,
                    id: editingLink.id,
                    slug: editingLink.slug,
                    title: editingLink.title,
                    url: editingLink.url,
                  }
                : undefined
            }
            existingSlugs={orderedLinks.map((l) => l.slug)}
            groups={isPro ? orderedGroups : []}
            isPro={isPro}
            key={linkDialogKey}
            onSuccess={handleLinkDialogSuccess}
            username={username}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Link Dialog */}
      <Dialog onOpenChange={handleDeleteLinkDialogOnOpenChange} open={deletingLink !== null}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteLink")}</DialogTitle>
            <DialogDescription>{t("areYouSureYouWantToDeleteThisLinkThisActionCannotBeUndone")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button disabled={isDeleting} onClick={handleConfirmDeleteLink} variant="tertiary">
              {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog onOpenChange={handleBulkDeleteDialogOnOpenChange} open={showBulkDeleteDialog}>
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

      {/* Add / Edit Group Dialog */}
      <Dialog onOpenChange={handleGroupDialogOnOpenChange} open={groupDialogMode !== null}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGroup != null ? t("editLinkGroup") : t("addLinkGroup")}</DialogTitle>
            <DialogDescription className="sr-only">
              {editingGroup != null ? t("editLinkGroup") : t("addLinkGroup")}
            </DialogDescription>
          </DialogHeader>
          <GroupForm
            defaultValues={editingGroup != null ? { id: editingGroup.id, title: editingGroup.title } : undefined}
            key={groupDialogKey}
            onSuccess={handleGroupDialogSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Group Dialog */}
      <DeleteGroupDialog
        groupId={deletingGroup?.id ?? null}
        groupTitle={deletingGroup?.title ?? ""}
        linkCount={deletingGroup != null ? (groupLinkCounts[deletingGroup.id] ?? 0) : 0}
        onOpenChange={handleDeleteGroupDialogOnOpenChange}
        open={deletingGroup !== null}
      />
    </div>
  );
};
