"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Settings, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type BoardActionsMenuProps = {
  inviteAvailable?: boolean;
  teamId: string;
  onInvite: () => void;
};

export const BoardActionsMenu: React.FC<BoardActionsMenuProps> = (props) => {
  const { inviteAvailable = true, onInvite, teamId } = props;

  //* State
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={t("moreActions")}
          className="border-sf-border bg-sf-elevated text-sf-muted hover:text-sf-text shrink-0 rounded-[var(--sf-radius)] border p-2 transition-colors"
          type="button"
        >
          <MoreHorizontal aria-hidden className="size-4" strokeWidth={1.75} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/teams">
            <Users aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
            {t("yourTeams")}
          </Link>
        </DropdownMenuItem>
        {inviteAvailable ? (
          <DropdownMenuItem onSelect={onInvite}>
            <UserPlus aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
            {t("invite")}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem asChild>
          <Link href={`/teams/${teamId}/settings`}>
            <Settings aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
            {t("settings")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
