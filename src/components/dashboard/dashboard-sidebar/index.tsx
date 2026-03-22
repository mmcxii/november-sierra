"use client";

import { DashboardThemeToggle } from "@/components/dashboard/theme-toggle";
import { SiteBrandmark } from "@/components/marketing/site-brandmark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type SessionUser } from "@/lib/auth";
import { isProUser } from "@/lib/tier";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@clerk/nextjs";
import { Anchor, Menu, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { ADMIN_NAV_ITEMS, NAV_ITEMS } from "./utils";

export type DashboardSidebarProps = {
  isAdmin?: boolean;
  user: SessionUser;
};

export const DashboardSidebar: React.FC<DashboardSidebarProps> = (props) => {
  const { isAdmin: isAdminUser, user } = props;

  //* State
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  //* Variables
  const initials = (user.displayName ?? user.username).slice(0, 2).toUpperCase();
  const isPro = isProUser(user);

  //* Handlers
  const closeMobile = () => setMobileOpen(false);
  const handleButtonOnClick = () => setMobileOpen(!mobileOpen);

  //* Effects
  React.useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile header */}
      <header className="bg-sidebar border-sidebar-border flex items-center justify-between border-b px-4 py-3 lg:hidden">
        <Link href="/dashboard" onClick={closeMobile}>
          <SiteBrandmark
            dividerClassName="bg-anc-deep-navy/18 dark:bg-anc-gold/25"
            size="xs"
            wordmarkClassName="text-anc-deep-navy dark:text-anc-gold"
          />
        </Link>
        <button
          aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
          className="text-sidebar-foreground p-1"
          onClick={handleButtonOnClick}
          type="button"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div aria-hidden="true" className="bg-anc-deep-navy/50 fixed inset-0 z-40 lg:hidden" onClick={closeMobile} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-sidebar border-sidebar-border text-sidebar-foreground fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r transition-transform duration-200 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 lg:overflow-y-auto",
          { "-translate-x-full": !mobileOpen, "translate-x-0": mobileOpen },
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center px-4">
          <Link className="inline-flex items-center" href="/dashboard" onClick={closeMobile}>
            <SiteBrandmark
              dividerClassName="bg-anc-deep-navy/18 dark:bg-anc-gold/25"
              size="xs"
              wordmarkClassName="text-anc-deep-navy dark:text-anc-gold"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      {
                        "bg-sidebar-accent text-sidebar-accent-foreground": isActive,
                        "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground":
                          !isActive,
                      },
                    )}
                    href={item.href}
                    onClick={closeMobile}
                  >
                    <item.icon className="size-4" />
                    {t(item.labelKey)}
                  </Link>
                </li>
              );
            })}
          </ul>
          {isAdminUser && (
            <>
              <hr className="border-anc-gold/25 mx-3 mt-2" />
              <ul className="mt-2 flex flex-col gap-1">
                {ADMIN_NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <li key={item.href}>
                      <Link
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          {
                            "bg-sidebar-accent text-sidebar-accent-foreground": isActive,
                            "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground":
                              !isActive,
                          },
                        )}
                        href={item.href}
                        onClick={closeMobile}
                      >
                        <item.icon className="size-4" />
                        {t(item.labelKey)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </nav>

        {/* Upgrade CTA (free users only) */}
        {!isPro && (
          <div className="px-3 pb-3">
            <Link
              className="bg-primary/8 hover:bg-primary/14 border-primary/15 flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
              href="/dashboard/settings"
              onClick={closeMobile}
            >
              <Sparkles className="text-primary size-4 shrink-0" />
              <div className="flex flex-col">
                <span className="text-sidebar-foreground text-sm font-medium">{t("upgradeToPro")}</span>
                <span className="text-sidebar-foreground/50 text-xs">{t("unlimitedLinks")}</span>
              </div>
            </Link>
          </div>
        )}

        {/* User menu */}
        <div className="border-sidebar-border border-t p-3">
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger className="hover:bg-sidebar-accent flex flex-1 items-center gap-3 rounded-md px-3 py-2 outline-none">
                <Avatar size="sm">
                  {user.avatarUrl != null && (
                    <AvatarImage alt={user.displayName ?? user.username} src={user.avatarUrl} />
                  )}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left">
                  <span className="text-sidebar-foreground flex items-center gap-1.5 text-sm font-medium">
                    {user.displayName ?? user.username}
                    {isPro && (
                      <span className="bg-primary/15 text-primary inline-flex items-center gap-1 rounded px-1 py-px text-[10px] font-semibold tracking-wide uppercase">
                        <Anchor className="size-2.5" />
                        {t("pro")}
                      </span>
                    )}
                  </span>
                  {/* eslint-disable-next-line anchr/no-raw-string-jsx -- dynamic username with @ prefix */}
                  <span className="text-sidebar-foreground/50 text-xs">@{user.username}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56" side="top">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">{t("settings")}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <SignOutButton>
                  <DropdownMenuItem>{t("signOut")}</DropdownMenuItem>
                </SignOutButton>
              </DropdownMenuContent>
            </DropdownMenu>
            <DashboardThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
};
