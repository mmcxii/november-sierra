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
        <div className="flex size-20 items-center justify-center rounded-full border border-[var(--_mc-avatar-outer-ring)]">
          <div className="flex size-16 items-center justify-center rounded-full border border-[var(--_mc-avatar-inner-border)] bg-[var(--_mc-avatar-bg)]">
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
              <Anchor className="size-7 text-[var(--_mc-anchor-color)]" strokeWidth={1.25} />
            )}
          </div>
        </div>
      </div>
      <h1 className="text-lg font-bold tracking-wide text-[var(--_mc-name-color)]">{name}</h1>
      <p className="mt-0.5 text-xs font-medium tracking-[0.2em] text-[var(--_mc-link-text)] uppercase">@{username}</p>
    </div>
  );
};
