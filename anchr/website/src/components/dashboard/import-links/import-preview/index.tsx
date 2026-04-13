"use client";

import { confirmImport, type ConfirmImportResult } from "@/app/(dashboard)/dashboard/import-actions";
import { Button } from "@/components/ui/button";
import type { TranslationKey } from "@/lib/i18n/i18next";
import type { ImportedLink, ImportedPage } from "@/lib/import/types";
import { PLATFORMS } from "@/lib/platforms";
import type { PlatformId } from "@/lib/platforms";
import { Check, Loader2, X } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type ImportPreviewProps = {
  page: ImportedPage;
  onBack: () => void;
  onComplete: (result: ConfirmImportResult & { success: true }) => void;
};

export const ImportPreview: React.FC<ImportPreviewProps> = (props) => {
  const { onBack, onComplete, page } = props;

  //* State
  const { t } = useTranslation();
  const [selectedLinks, setSelectedLinks] = React.useState<Set<number>>(() => {
    return new Set(page.links.map((_, i) => i));
  });
  const [applyDisplayName, setApplyDisplayName] = React.useState(page.profile.displayName != null);
  const [applyBio, setApplyBio] = React.useState(page.profile.bio != null);
  const [applyAvatar, setApplyAvatar] = React.useState(page.profile.avatarUrl != null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  //* Variables
  const hasProfile = page.profile.displayName != null || page.profile.bio != null || page.profile.avatarUrl != null;

  //* Handlers
  const toggleLink = (index: number) => {
    setSelectedLinks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedLinks.size === page.links.length) {
      setSelectedLinks(new Set());
    } else {
      setSelectedLinks(new Set(page.links.map((_, i) => i)));
    }
  };

  const handleConfirm = async () => {
    const links: ImportedLink[] = page.links
      .filter((_, i) => selectedLinks.has(i))
      .map((link, i) => ({ ...link, position: i }));

    if (links.length === 0) {
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const result = await confirmImport({
        links,
        profile: {
          applyAvatar,
          applyBio,
          applyDisplayName,
          data: page.profile,
        },
      });

      if (result.success) {
        onComplete(result);
      } else {
        setError(t(result.error as TranslationKey));
      }
    } catch {
      setError(t("somethingWentWrongPleaseTryAgain"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarOnChange = () => {
    setApplyAvatar(!applyAvatar);
  };

  const handleDisplayNameOnChange = () => {
    setApplyDisplayName(!applyDisplayName);
  };

  const handleBioOnChange = () => {
    setApplyBio(!applyBio);
  };

  //* Render
  return (
    <div className="flex flex-col gap-6">
      {/* Profile section */}
      {hasProfile && (
        <div className="flex flex-col gap-3">
          <h3 className="text-muted-foreground text-sm font-medium">{t("profile")}</h3>
          <div className="flex flex-col gap-2 rounded-lg border p-4">
            {page.profile.avatarUrl != null && (
              <label className="flex items-center gap-3">
                <input
                  checked={applyAvatar}
                  className="border-input accent-primary size-4 rounded"
                  onChange={handleAvatarOnChange}
                  type="checkbox"
                />
                <Image
                  alt=""
                  className="size-8 rounded-full object-cover"
                  height={32}
                  src={page.profile.avatarUrl}
                  width={32}
                />
                <span className="text-sm">{t("profilePhoto")}</span>
              </label>
            )}
            {page.profile.displayName != null && (
              <label className="flex items-center gap-3">
                <input
                  checked={applyDisplayName}
                  className="border-input accent-primary size-4 rounded"
                  onChange={handleDisplayNameOnChange}
                  type="checkbox"
                />
                <span className="text-sm">{page.profile.displayName}</span>
              </label>
            )}
            {page.profile.bio != null && (
              <label className="flex items-center gap-3">
                <input
                  checked={applyBio}
                  className="border-input accent-primary size-4 rounded"
                  onChange={handleBioOnChange}
                  type="checkbox"
                />
                <span className="text-muted-foreground max-w-xs truncate text-sm">{page.profile.bio}</span>
              </label>
            )}
          </div>
        </div>
      )}

      {/* Links section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-muted-foreground text-sm font-medium">
            {t("links{{selectedCount}}{{totalCount}}", {
              selectedCount: selectedLinks.size,
              totalCount: page.links.length,
            })}
          </h3>
          <button className="text-muted-foreground hover:text-foreground text-xs" onClick={toggleAll} type="button">
            {selectedLinks.size === page.links.length ? t("deselectAll") : t("selectAll")}
          </button>
        </div>

        <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {page.links.map((link, i) => {
            const handleLinkToggle = () => {
              toggleLink(i);
            };

            return (
              <label
                className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors"
                key={link.url}
              >
                <input
                  checked={selectedLinks.has(i)}
                  className="border-input accent-primary size-4 shrink-0 rounded"
                  onChange={handleLinkToggle}
                  type="checkbox"
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{link.title}</span>
                  <span className="text-muted-foreground truncate text-xs">{link.url}</span>
                </div>
                {link.platform != null && link.platform in PLATFORMS && (
                  <span className="text-muted-foreground text-xs">{PLATFORMS[link.platform as PlatformId].name}</span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {error.length > 0 && <p className="text-destructive text-sm">{error}</p>}

      {/* Actions */}
      <div className="flex gap-2">
        <Button className="flex-1" disabled={submitting} onClick={onBack} variant="secondary">
          <X className="size-4" />
          {t("back")}
        </Button>
        <Button className="flex-1" disabled={submitting || selectedLinks.size === 0} onClick={handleConfirm}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {t("import{{count}}Links", { count: selectedLinks.size })}
        </Button>
      </div>
    </div>
  );
};
