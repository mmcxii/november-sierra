import { Anchor } from "lucide-react";
import Image from "next/image";
import * as React from "react";

export type ProfileHeaderProps = {
  avatarUrl: null | string;
  displayName: null | string;
  username: string;
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = (props) => {
  const { avatarUrl, displayName, username } = props;

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
    </div>
  );
};
