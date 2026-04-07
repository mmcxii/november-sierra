"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { MOBILE_LINKS, STAGGER_MS } from "./constants";
import { HamburgerIcon } from "./hamburger-icon";

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
        <HamburgerIcon open={open} />
      </button>

      {/* Full-screen overlay */}
      <div
        aria-hidden={!open}
        className={cn(
          "m-mobile-overlay fixed inset-0 z-[55] flex flex-col items-center justify-center bg-(--m-page-bg) sm:hidden",
          { "is-open": open },
        )}
      >
        {/* Wave motif — matches marketing page background */}
        <div className="m-wave-mask pointer-events-none absolute inset-x-0 top-0 h-[50%]">
          <svg className="h-full w-full" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern height="20" id="menuWaves" patternUnits="userSpaceOnUse" width="280" x="0" y="0">
                <path
                  className="m-wave-stroke"
                  d="M-70,10 C-52.5,3 -17.5,17 0,10 C17.5,3 52.5,17 70,10 C87.5,3 122.5,17 140,10 C157.5,3 192.5,17 210,10 C227.5,3 262.5,17 280,10 C297.5,3 332.5,17 350,10"
                  fill="none"
                  strokeWidth="0.8"
                />
              </pattern>
            </defs>
            <rect fill="url(#menuWaves)" height="100%" width="100%" />
          </svg>
        </div>

        {/* Navigation links with staggered rise animation */}
        <nav className="relative flex flex-col items-center gap-8">
          {MOBILE_LINKS.map((link, i) => (
            <Link
              className="m-mobile-overlay-link text-2xl font-medium transition-opacity hover:opacity-70"
              href={link.href}
              key={link.href}
              onClick={handleClose}
              ref={(el) => {
                if (el != null) {
                  el.style.transitionDelay = `${(i + 1) * STAGGER_MS}ms`;
                }
              }}
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};
