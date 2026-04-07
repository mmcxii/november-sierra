"use client";

import { RenderedIcon } from "@/components/ui/rendered-icon";
import type { IconEntry } from "@/lib/icon-registry";
import { cn } from "@/lib/utils";
import * as React from "react";

export type IconButtonProps = {
  icon: IconEntry;
  isSelected: boolean;
  onClick: (icon: IconEntry) => void;
};

export const IconButton: React.FC<IconButtonProps> = (props) => {
  const { icon, isSelected, onClick } = props;

  //* Handlers
  const handleButtonOnClick = () => onClick(icon);

  return (
    <button
      className={cn("flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors", {
        "bg-primary text-primary-foreground": isSelected,
        "text-muted-foreground hover:bg-muted hover:text-foreground": !isSelected,
      })}
      onClick={handleButtonOnClick}
      title={icon.name}
      type="button"
    >
      <RenderedIcon className="size-4" iconId={icon.id} />
    </button>
  );
};
