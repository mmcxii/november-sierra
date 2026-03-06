import { SiteLogo } from "@/components/marketing/site-logo";
import { SiteWordmark } from "@/components/marketing/site-wordmark";
import Link from "next/link";

export const SiteHeader: React.FC = () => {
  return (
    <header className="relative z-10 px-6 py-6">
      <div className="mx-auto max-w-6xl">
        <Link className="group inline-flex items-center gap-4" href="/">
          <SiteLogo size="sm" />
          <div className="m-accent-divider-25 h-7 w-px" />
          <span className="transition-opacity group-hover:opacity-75">
            <SiteWordmark size="sm" />
          </span>
        </Link>
      </div>
    </header>
  );
};
