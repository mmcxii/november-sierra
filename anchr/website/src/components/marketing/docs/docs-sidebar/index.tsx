"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { STATIC_SECTIONS } from "../constants";

export type DocsSidebarProps = {
  resourceTags: string[];
};

export const DocsSidebar: React.FC<DocsSidebarProps> = (props) => {
  const { resourceTags } = props;

  const { t } = useTranslation();
  const [activeSection, setActiveSection] = React.useState<string>("overview");

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );

    const allSections = [...STATIC_SECTIONS, ...resourceTags.map((tag) => `resource-${tag.toLowerCase()}`)];

    for (const id of allSections) {
      const el = document.getElementById(id);
      if (el != null) {
        observer.observe(el);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [resourceTags]);

  const handleClick = React.useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute("href");
    if (href == null) {
      return;
    }
    const id = href.slice(1);
    const el = document.getElementById(id);
    if (el != null) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  }, []);

  const linkClass = (id: string) => {
    return cn("block py-1.5 text-sm transition-colors", {
      "font-medium text-white": activeSection === id,
      "m-muted-40 hover:text-white/80": activeSection !== id,
    });
  };

  return (
    <nav className="sticky top-24 space-y-1" data-testid="docs-sidebar">
      <p className="mb-3 text-xs font-semibold tracking-wider uppercase">{t("contents")}</p>

      <a className={linkClass("overview")} href="#overview" onClick={handleClick}>
        {t("overview")}
      </a>
      <a className={linkClass("authentication")} href="#authentication" onClick={handleClick}>
        {t("authentication")}
      </a>
      <a className={linkClass("rateLimits")} href="#rateLimits" onClick={handleClick}>
        {t("rateLimits")}
      </a>

      <p className="m-muted-40 mt-4 mb-2 text-xs font-semibold tracking-wider uppercase">{t("apiReference")}</p>

      {resourceTags.map((tag) => {
        const id = `resource-${tag.toLowerCase()}`;
        return (
          <a className={linkClass(id)} href={`#${id}`} key={tag} onClick={handleClick}>
            {tag}
          </a>
        );
      })}
    </nav>
  );
};
