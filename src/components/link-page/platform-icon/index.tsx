import { PLATFORM_CUSTOM_PATHS, PLATFORM_ICON_MAP } from "@/lib/platform-icons";
import { type PlatformId, PLATFORMS, isValidPlatformId } from "@/lib/platforms";
import * as React from "react";

export type PlatformIconProps = {
  className?: string;
  platform: string;
};

export const PlatformIcon: React.FC<PlatformIconProps> = (props) => {
  const { className, platform } = props;

  if (!isValidPlatformId(platform)) {
    return null;
  }

  const id = platform as PlatformId;
  const Icon = PLATFORM_ICON_MAP[id];

  if (Icon != null) {
    return (
      <span aria-label={PLATFORMS[id].name} role="img">
        <Icon aria-hidden className={className} color="currentColor" />
      </span>
    );
  }

  const path = PLATFORM_CUSTOM_PATHS[id];

  return path != null ? (
    <svg
      aria-label={PLATFORMS[id].name}
      className={className}
      fill="currentColor"
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={path} />
    </svg>
  ) : null;
};
