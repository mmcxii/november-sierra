import { getEmojiCharacter, parseIconId } from "@/lib/icon-registry";
import { LUCIDE_ICON_COMPONENTS, SI_ICON_COMPONENTS } from "@/lib/icon-registry-components";
import { cn } from "@/lib/utils";
import * as React from "react";

export type RenderedIconProps = {
  className?: string;
  iconId: string;
};

export const RenderedIcon: React.FC<RenderedIconProps> = (props) => {
  const { className, iconId } = props;

  const parsed = parseIconId(iconId);

  if (parsed == null) {
    return null;
  }

  if (parsed.provider === "emoji") {
    const char = getEmojiCharacter(parsed.name);
    return char != null ? (
      <span
        aria-hidden="true"
        className={cn("inline-flex items-center justify-center leading-none", className)}
        role="img"
      >
        {char}
      </span>
    ) : null;
  }

  if (parsed.provider === "lucide") {
    const Icon = LUCIDE_ICON_COMPONENTS[parsed.name];
    return Icon != null ? <Icon className={className} /> : null;
  }

  if (parsed.provider === "si") {
    const Icon = SI_ICON_COMPONENTS[parsed.name];
    return Icon != null ? <Icon className={className} color="currentColor" /> : null;
  }

  return null;
};
