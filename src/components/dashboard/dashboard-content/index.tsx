"use client";

import { LinkList, type GroupItem, type LinkItem } from "@/components/dashboard/link-list";
import { PreviewToggle } from "@/components/dashboard/preview-toggle";
import { QrCodeModal } from "@/components/dashboard/qr-code-modal";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/auth";
import { isProUser } from "@/lib/tier";
import { QrCode } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type DashboardContentProps = {
  groups: GroupItem[];
  links: LinkItem[];
  previewKey: string;
  user: SessionUser;
};

export const DashboardContent: React.FC<DashboardContentProps> = (props) => {
  const { groups, links, previewKey, user } = props;

  //* State
  const { t } = useTranslation();
  const [qrOpen, setQrOpen] = React.useState(false);
  const [qrUrl, setQrUrl] = React.useState("");
  const [qrLabel, setQrLabel] = React.useState("");

  //* Variables
  const isPro = isProUser(user);
  const customDomain = user.customDomainVerified && user.customDomain != null ? user.customDomain : null;
  const baseUrl = customDomain != null ? `https://${customDomain}` : `https://anchr.to/${user.username}`;

  //* Handlers
  const handleShareProfile = () => {
    setQrUrl(baseUrl);
    setQrLabel(customDomain ?? user.username);
    setQrOpen(true);
  };

  const handleQrCode = (link: LinkItem) => {
    setQrUrl(`${baseUrl}/${link.slug}`);
    setQrLabel(link.title);
    setQrOpen(true);
  };

  return (
    <>
      {/* Dashboard header row */}
      <div className="mb-4 flex items-center justify-between">
        <Button onClick={handleShareProfile} size="sm" type="button" variant="secondary">
          <QrCode className="size-4" />
          {t("shareProfile")}
        </Button>

        {/* Mobile preview button */}
        <div className="xl:hidden">
          <PreviewToggle previewKey={previewKey} user={user} />
        </div>
      </div>

      <LinkList
        customDomain={customDomain}
        groups={groups}
        isPro={isPro}
        links={links}
        onQrCode={handleQrCode}
        username={user.username}
      />

      <QrCodeModal
        avatarUrl={user.avatarUrl}
        isPro={isPro}
        label={qrLabel}
        onOpenChange={setQrOpen}
        open={qrOpen}
        url={qrUrl}
      />
    </>
  );
};
