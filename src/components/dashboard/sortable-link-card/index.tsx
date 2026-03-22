"use client";

import type { LinkItem } from "@/components/dashboard/link-list";
import { PlatformBadge } from "@/components/dashboard/platform-badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  Copy,
  EllipsisVertical,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  QrCode,
  Star,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type SortableLinkCardProps = {
  customDomain?: null | string;
  link: LinkItem;
  selected: boolean;
  username: string;
  onDelete: (link: LinkItem) => void;
  onEdit: (link: LinkItem) => void;
  onQrCode?: (link: LinkItem) => void;
  onSelect: (linkId: string) => void;
  onToggleFeatured?: (link: LinkItem) => void;
  onToggleVisibility: (link: LinkItem) => void;
};

export const SortableLinkCard: React.FC<SortableLinkCardProps> = (props) => {
  const {
    customDomain,
    link,
    onDelete,
    onEdit,
    onQrCode,
    onSelect,
    onToggleFeatured,
    onToggleVisibility,
    selected,
    username,
  } = props;

  //* State
  const { t } = useTranslation();
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({ id: link.id });
  const [copied, setCopied] = React.useState(false);

  //* Refs
  const copiedTimerRef = React.useRef<ReturnType<typeof setTimeout>>(null);

  //* Variables
  const VisibilityIcon = link.visible ? Eye : EyeOff;
  const redirectUrl = customDomain != null ? `${customDomain}/${link.slug}` : `anchr.to/${username}/${link.slug}`;
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  //* Handlers
  const handleCheckboxOnCheckedChange = () => onSelect(link.id);

  const handleCopyRedirectUrl = async () => {
    await navigator.clipboard.writeText(`https://${redirectUrl}`);
    setCopied(true);
    toast.success(t("{{title}}RedirectUrlCopied", { title: link.title }));
    if (copiedTimerRef.current != null) {
      clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleFeaturedDropdownMenuItemOnClick = () => onToggleFeatured?.(link);

  const handleDeleteDropdownMenuItemOnClick = () => onDelete(link);

  const handleEditDropdownMenuItemOnClick = () => onEdit(link);

  const handleQrCodeDropdownMenuItemOnClick = () => onQrCode(link);

  const handleVisibilityDropdownMenuItemOnClick = () => onToggleVisibility(link);

  //* Effects
  React.useEffect(() => {
    return () => {
      if (copiedTimerRef.current != null) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  return (
    <li
      className={cn("bg-card border-border flex items-center gap-2 rounded-lg border px-2 py-3", {
        "opacity-50": isDragging || !link.visible,
      })}
      ref={setNodeRef}
      // eslint-disable-next-line anchr/no-inline-style -- dnd-kit requires dynamic transform/transition via inline style
      style={style}
    >
      <Checkbox
        aria-label={t("selectLink")}
        checked={selected}
        className="ml-1"
        onCheckedChange={handleCheckboxOnCheckedChange}
      />

      <button
        aria-label={t("reorder")}
        className="text-muted-foreground hover:text-foreground shrink-0 cursor-grab touch-none p-1 active:cursor-grabbing"
        type="button"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-card-foreground flex items-center gap-1.5 truncate text-sm font-medium">
          <span className="truncate">{link.title}</span>
          {link.platform != null && <PlatformBadge platform={link.platform} />}
          {link.isFeatured && (
            <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px] leading-none font-medium">
              {t("featured")}
            </span>
          )}
          {!link.visible && (
            <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px] leading-none font-medium">
              {t("hidden")}
            </span>
          )}
        </p>
        <div className="flex flex-col gap-0.5 md:flex-row md:items-center md:gap-2">
          <a
            className="text-muted-foreground flex items-center gap-1 truncate text-xs hover:underline"
            href={link.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink className="size-3 shrink-0" />
            <span className="truncate">{link.url}</span>
          </a>
          <button
            aria-label={t("copyRedirectUrl")}
            className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 text-xs"
            onClick={handleCopyRedirectUrl}
            type="button"
          >
            {copied ? <Check className="size-3 shrink-0" /> : <Copy className="size-3 shrink-0" />}
            <span className="truncate">{redirectUrl}</span>
          </button>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton aria-label={t("actions")}>
            <EllipsisVertical className="size-4" />
          </IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onQrCode != null && (
            <DropdownMenuItem onClick={handleQrCodeDropdownMenuItemOnClick}>
              <QrCode />
              {t("qrCode")}
            </DropdownMenuItem>
          )}
          {onToggleFeatured != null && (
            <DropdownMenuItem onClick={handleFeaturedDropdownMenuItemOnClick}>
              <Star />
              {link.isFeatured ? t("unfeatureLink") : t("featureLink")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleVisibilityDropdownMenuItemOnClick}>
            <VisibilityIcon />
            {link.visible ? t("hideLink") : t("showLink")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEditDropdownMenuItemOnClick}>
            <Pencil />
            {t("editLink")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDeleteDropdownMenuItemOnClick} variant="destructive">
            <Trash2 />
            {t("deleteLink")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
};
