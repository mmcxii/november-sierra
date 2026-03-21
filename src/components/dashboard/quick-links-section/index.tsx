"use client";

import type { GroupItem, LinkItem } from "@/components/dashboard/link-list";
import { SortableLinkCard } from "@/components/dashboard/sortable-link-card";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type QuickLinksSectionProps = {
  group: GroupItem;
  links: LinkItem[];
  selectedIds: Set<string>;
  username: string;
  onDeleteLink: (link: LinkItem) => void;
  onEditLink: (link: LinkItem) => void;
  onQrCode?: (link: LinkItem) => void;
  onSelectLink: (linkId: string) => void;
  onToggleGroupVisibility: (group: GroupItem) => void;
  onToggleLinkVisibility: (link: LinkItem) => void;
};

export const QuickLinksSection: React.FC<QuickLinksSectionProps> = (props) => {
  const {
    group,
    links,
    onDeleteLink,
    onEditLink,
    onQrCode,
    onSelectLink,
    onToggleGroupVisibility,
    onToggleLinkVisibility,
    selectedIds,
    username,
  } = props;

  //* State
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = React.useState(false);
  const { setNodeRef: setDroppableRef } = useDroppable({ id: `group-drop:${group.id}` });

  //* Variables
  const VisibilityIcon = group.visible ? Eye : EyeOff;
  const CollapseIcon = collapsed ? ChevronRight : ChevronDown;

  return (
    <div className="flex flex-col gap-2">
      {/* Group header */}
      <div
        className={cn("bg-card border-border flex items-center gap-1.5 rounded-lg border px-2 py-2", {
          "opacity-60": !group.visible,
        })}
      >
        <button
          className="text-muted-foreground hover:text-foreground shrink-0 p-1"
          onClick={() => setCollapsed((c) => !c)}
          type="button"
        >
          <CollapseIcon className="size-4" />
        </button>

        <span className="text-card-foreground flex-1 truncate text-sm font-semibold">{t("quickLinks")}</span>

        {!group.visible && (
          <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px] leading-none font-medium">
            {t("hidden")}
          </span>
        )}

        <IconButton
          aria-label={group.visible ? t("hideLink") : t("showLink")}
          onClick={() => onToggleGroupVisibility(group)}
        >
          <VisibilityIcon className="size-4" />
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
                    key={link.id}
                    link={link}
                    onDelete={onDeleteLink}
                    onEdit={onEditLink}
                    onQrCode={onQrCode}
                    onSelect={onSelectLink}
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
