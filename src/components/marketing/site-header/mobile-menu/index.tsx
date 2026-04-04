"use client";

import { NAV_LINKS } from "@/components/marketing/site-header/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "react-i18next";

export const MobileMenu: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleToggle = React.useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleClose = React.useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      {/* Hamburger / X toggle */}
      <button
        aria-expanded={open}
        aria-label={open ? t("closeMenu") : t("openMenu")}
        className="relative z-[60] flex size-9 items-center justify-center sm:hidden"
        onClick={handleToggle}
      >
        <div className="flex h-4 w-5 flex-col justify-between">
          <span
            className={cn(
              "block h-[1.5px] w-full origin-center rounded-full bg-current transition-all duration-300 ease-in-out",
              { "translate-y-[7px] rotate-45": open },
            )}
          />
          <span
            className={cn("block h-[1.5px] w-full rounded-full bg-current transition-all duration-300 ease-in-out", {
              "opacity-0": open,
            })}
          />
          <span
            className={cn(
              "block h-[1.5px] w-full origin-center rounded-full bg-current transition-all duration-300 ease-in-out",
              { "-translate-y-[7px] -rotate-45": open },
            )}
          />
        </div>
      </button>

      {/* Full-screen overlay */}
      <div
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-[55] flex items-center justify-center bg-(--m-page-bg) transition-opacity duration-300 ease-in-out sm:hidden",
          {
            "opacity-100": open,
            "pointer-events-none opacity-0": !open,
          },
        )}
      >
        <nav className="flex flex-col items-center gap-8">
          {NAV_LINKS.filter((link) => link.href !== "/").map((link) => (
            <Link
              className="text-2xl font-medium transition-opacity hover:opacity-70"
              href={link.href}
              key={link.href}
              onClick={handleClose}
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};
