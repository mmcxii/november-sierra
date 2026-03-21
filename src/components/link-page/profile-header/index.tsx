import { PlatformIcon } from "@/components/link-page/platform-icon";
import { Anchor, Link2 } from "lucide-react";
import Image from "next/image";
import * as React from "react";

type QuickLinkData = {
  id: string;
  platform: null | string;
  slug: string;
  title: string;
  url: string;
};

export type ProfileHeaderProps = {
  avatarUrl: null | string;
  displayName: null | string;
  quickLinks?: QuickLinkData[];
  username: string;
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = (props) => {
  const { avatarUrl, displayName, quickLinks = [], username } = props;

  //* Variables
  const name = displayName ?? username;

  return (
    <div className="flex flex-col items-center pt-2">
      <div className="relative mb-4">
        <div className="border-anc-theme-avatar-outer-ring flex size-20 items-center justify-center rounded-full border">
          <div className="border-anc-theme-avatar-inner-border bg-anc-theme-avatar-bg flex size-16 items-center justify-center rounded-full border">
            {avatarUrl != null ? (
              <Image
                alt={name}
                className="size-16 rounded-full object-cover"
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
      <h1 className="text-anc-theme-name text-lg font-bold tracking-wide">{name}</h1>
      <p className="tracking-anc-caps text-anc-theme-link-text mt-0.5 text-xs font-medium uppercase">@{username}</p>

      {quickLinks.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {quickLinks.map((link) => (
            <a
              className="border-anc-theme-link-border bg-anc-theme-link-bg flex size-10 items-center justify-center rounded-full border transition-transform hover:scale-110 active:scale-95"
              href={`/${username}/${link.slug}`}
              key={link.id}
              rel="noopener noreferrer"
              target="_blank"
              title={link.title}
            >
              {link.platform != null ? (
                <PlatformIcon className="text-anc-theme-link-icon size-4" platform={link.platform} />
              ) : (
                <Link2 className="text-anc-theme-link-icon size-4" strokeWidth={1.75} />
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
