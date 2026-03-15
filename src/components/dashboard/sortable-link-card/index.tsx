"use client";

import type { LinkItem } from "@/components/dashboard/link-list";
import { Checkbox } from "@/components/ui/checkbox";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Copy, ExternalLink, Eye, EyeOff, GripVertical, Pencil, Trash2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type SortableLinkCardProps = {
  link: LinkItem;
  selected: boolean;
  username: string;
  onDelete: (link: LinkItem) => void;
  onEdit: (link: LinkItem) => void;
  onSelect: (linkId: string) => void;
  onToggleVisibility: (link: LinkItem) => void;
};

export const SortableLinkCard: React.FC<SortableLinkCardProps> = (props) => {
  const { link, onDelete, onEdit, onSelect, onToggleVisibility, selected, username } = props;

  //* State
  const { t } = useTranslation();
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({ id: link.id });
  const [copied, setCopied] = React.useState(false);

  //* Refs
  const copiedTimerRef = React.useRef<ReturnType<typeof setTimeout>>(null);

  //* Variables
  const VisibilityIcon = link.visible ? Eye : EyeOff;
  const redirectUrl = `anchr.to/${username}/${link.slug}`;
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  //* Handlers
  const handleCopyRedirectUrl = async () => {
    await navigator.clipboard.writeText(`https://${redirectUrl}`);
    setCopied(true);
    toast.success(t("{{title}}RedirectUrlCopied", { title: link.title }));
    if (copiedTimerRef.current != null) {
      clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

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
        onCheckedChange={() => onSelect(link.id)}
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

      <div className="flex shrink-0 items-center gap-1">
        <IconButton aria-label={link.visible ? t("hideLink") : t("showLink")} onClick={() => onToggleVisibility(link)}>
          <VisibilityIcon className="size-4" />
        </IconButton>
        <IconButton aria-label={t("editLink")} onClick={() => onEdit(link)}>
          <Pencil className="size-4" />
        </IconButton>
        <IconButton aria-label={t("deleteLink")} onClick={() => onDelete(link)} variant="destructive">
          <Trash2 className="size-4" />
        </IconButton>
      </div>
    </li>
  );
};
