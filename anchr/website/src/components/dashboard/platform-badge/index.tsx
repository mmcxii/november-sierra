import { PLATFORM_CUSTOM_ICONS, PLATFORM_ICON_MAP } from "@/lib/platform-icons";
import { type PlatformId, PLATFORMS, isValidPlatformId } from "@/lib/platforms";
import * as React from "react";

export type PlatformBadgeProps = {
  platform: string;
};

export const PlatformBadge: React.FC<PlatformBadgeProps> = (props) => {
  const { platform } = props;

  if (!isValidPlatformId(platform)) {
    return null;
  }

  const id = platform as PlatformId;
  const Icon = PLATFORM_ICON_MAP[id];
  const custom = PLATFORM_CUSTOM_ICONS[id];

  return (
    <span className="bg-primary/10 text-primary flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] leading-none font-medium">
      {Icon != null && <Icon aria-hidden className="size-3" color="currentColor" />}
      {Icon == null && custom != null && (
        <svg
          aria-hidden
          className="size-3"
          fill="currentColor"
          viewBox={custom.viewBox ?? "0 0 24 24"}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={custom.d} />
        </svg>
      )}
      {PLATFORMS[id].name}
    </span>
  );
};
