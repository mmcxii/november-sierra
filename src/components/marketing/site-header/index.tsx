import Link from "next/link";

import { SiteLogo } from "@/components/marketing/site-logo";
import { SiteWordmark } from "@/components/marketing/site-wordmark";

export const SiteHeader: React.FC = () => {
  return (
    <header className="relative z-10 px-6 py-6">
      <div className="mx-auto max-w-6xl">
        <Link className="group inline-flex items-center gap-4" href="/">
          <SiteLogo size="sm" />
          <div className="h-7 w-px" style={{ background: `rgb(var(--m-accent) / 0.25)` }} />
          <span className="transition-opacity group-hover:opacity-75">
            <SiteWordmark size="sm" />
          </span>
        </Link>
      </div>
    </header>
  );
};
