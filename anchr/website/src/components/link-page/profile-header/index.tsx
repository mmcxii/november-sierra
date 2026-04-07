import { PlatformIcon } from "@/components/link-page/platform-icon";
import { RenderedIcon } from "@/components/ui/rendered-icon";
import { Anchor, Link2 } from "lucide-react";
import Image from "next/image";
import * as React from "react";

type QuickLinkData = {
  icon: null | string;
  id: string;
  platform: null | string;
  slug: string;
  title: string;
  url: string;
};

export type ProfileHeaderProps = {
  avatarUrl: null | string;
  basePath?: string;
  bio?: null | string;
  displayName: null | string;
  quickLinks?: QuickLinkData[];
  username: string;
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = (props) => {
  const { avatarUrl, basePath, bio, displayName, quickLinks = [], username } = props;

  const linkBasePath = basePath ?? `/${username}`;

  //* Variables
  const name = displayName ?? username;

  return (
    <div className="anchr-profile-header flex flex-col items-center pt-2">
      <div className="relative mb-4">
        <div className="anchr-avatar-ring border-anc-theme-avatar-outer-ring flex size-20 items-center justify-center rounded-full border">
          <div className="anchr-avatar border-anc-theme-avatar-inner-border bg-anc-theme-avatar-bg flex size-16 items-center justify-center rounded-full border">
            {avatarUrl != null ? (
              <Image
                alt={name}
                className="anchr-avatar-img size-16 rounded-full object-cover"
                height={64}
                priority
                src={avatarUrl}
                width={64}
              />
            ) : (
              <Anchor className="text-anc-theme-anchor size-7" strokeWidth={1.25} />
            )}
          </div>
        </div>
      </div>
      {/* eslint-disable anchr/no-raw-string-jsx -- sr-only brand prefix for SEO */}
      <h1 className="anchr-display-name text-anc-theme-name text-lg font-bold tracking-wide">
        <span className="sr-only">Anchr | </span>
        <span>{name}</span>
      </h1>
      {/* eslint-enable anchr/no-raw-string-jsx */}
      {bio != null && bio.length > 0 && (
        <p className="anchr-bio text-anc-theme-link-text mt-1 max-w-xs text-center text-sm">{bio}</p>
      )}

      {quickLinks.length > 0 && (
        <div className="anchr-quick-links mt-3 flex flex-wrap items-center justify-center gap-2">
          {quickLinks.map((link) => (
            <a
              className="anchr-quick-link border-anc-theme-link-border bg-anc-theme-link-bg flex size-10 items-center justify-center rounded-full border transition-transform hover:scale-110 active:scale-95"
              href={`${linkBasePath}/${link.slug}`}
              key={link.id}
              rel="noopener noreferrer"
              target="_blank"
              title={link.title}
            >
              {link.icon != null && (
                <RenderedIcon className="anchr-quick-link-icon text-anc-theme-link-icon size-4" iconId={link.icon} />
              )}
              {link.icon == null && link.platform != null && (
                <PlatformIcon
                  className="anchr-quick-link-icon text-anc-theme-link-icon size-4"
                  platform={link.platform}
                />
              )}
              {link.icon == null && link.platform == null && (
                <Link2 className="anchr-quick-link-icon text-anc-theme-link-icon size-4" strokeWidth={1.75} />
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
