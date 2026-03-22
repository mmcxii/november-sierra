"use client";

import type { GroupItem, LinkItem } from "@/components/dashboard/link-list";
import { SortableLinkCard } from "@/components/dashboard/sortable-link-card";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, Eye, EyeOff, GripVertical, Pencil, Trash2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type SortableGroupProps = {
  customDomain?: null | string;
  group: GroupItem;
  links: LinkItem[];
  selectedIds: Set<string>;
  username: string;
  onDeleteGroup: (group: GroupItem) => void;
  onDeleteLink: (link: LinkItem) => void;
  onEditGroup: (group: GroupItem) => void;
  onEditLink: (link: LinkItem) => void;
  onQrCode?: (link: LinkItem) => void;
  onSelectLink: (linkId: string) => void;
  onToggleFeatured?: (link: LinkItem) => void;
  onToggleGroupVisibility: (group: GroupItem) => void;
  onToggleLinkVisibility: (link: LinkItem) => void;
};

export const SortableGroup: React.FC<SortableGroupProps> = (props) => {
  const {
    customDomain,
    group,
    links,
    onDeleteGroup,
    onDeleteLink,
    onEditGroup,
    onEditLink,
    onQrCode,
    onSelectLink,
    onToggleFeatured,
    onToggleGroupVisibility,
    onToggleLinkVisibility,
    selectedIds,
    username,
  } = props;

  //* State
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = React.useState(false);
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: `group:${group.id}`,
  });

  const { setNodeRef: setDroppableRef } = useDroppable({ id: `group-drop:${group.id}` });

  //* Variables
  const VisibilityIcon = group.visible ? Eye : EyeOff;
  const CollapseIcon = collapsed ? ChevronRight : ChevronDown;
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  //* Handlers
  const handleButtonOnClick = () => setCollapsed((c) => !c);
  const handleIconButtonOnClick = () => onToggleGroupVisibility(group);
  const handleEditIconButtonOnClick = () => onEditGroup(group);
  const handleDeleteIconButtonOnClick = () => onDeleteGroup(group);

  return (
    <div
      className={cn("flex flex-col gap-2", { "opacity-50": isDragging })}
      ref={setNodeRef}
      // eslint-disable-next-line anchr/no-inline-style -- dnd-kit requires dynamic transform/transition via inline style
      style={style}
    >
      {/* Group header */}
      <div
        className={cn("bg-card border-border flex items-center gap-1.5 rounded-lg border px-2 py-2", {
          "opacity-60": !group.visible,
        })}
      >
        <button
          aria-label={t("reorder")}
          className="text-muted-foreground hover:text-foreground shrink-0 cursor-grab touch-none p-1 active:cursor-grabbing"
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        <button
          className="text-muted-foreground hover:text-foreground shrink-0 p-1"
          onClick={handleButtonOnClick}
          type="button"
        >
          <CollapseIcon className="size-4" />
        </button>

        <span className="text-card-foreground flex-1 truncate text-sm font-semibold">{group.title}</span>

        {!group.visible && (
          <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px] leading-none font-medium">
            {t("hidden")}
          </span>
        )}

        <IconButton aria-label={group.visible ? t("hideLink") : t("showLink")} onClick={handleIconButtonOnClick}>
          <VisibilityIcon className="size-4" />
        </IconButton>

        <IconButton aria-label={t("editLinkGroup")} onClick={handleEditIconButtonOnClick}>
          <Pencil className="size-4" />
        </IconButton>

        <IconButton aria-label={t("deleteLinkGroup")} onClick={handleDeleteIconButtonOnClick}>
          <Trash2 className="size-4" />
        </IconButton>
      </div>

      {/* Group links */}
      {!collapsed && (
        <div className="ml-4" ref={setDroppableRef}>
          <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            {links.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <SortableLinkCard
                    customDomain={customDomain}
                    key={link.id}
                    link={link}
                    onDelete={onDeleteLink}
                    onEdit={onEditLink}
                    onQrCode={onQrCode}
                    onSelect={onSelectLink}
                    onToggleFeatured={onToggleFeatured}
                    onToggleVisibility={onToggleLinkVisibility}
                    selected={selectedIds.has(link.id)}
                    username={username}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground py-4 text-center text-sm">{t("noLinksInThisGroup")}</p>
            )}
          </SortableContext>
        </div>
      )}
    </div>
  );
};
