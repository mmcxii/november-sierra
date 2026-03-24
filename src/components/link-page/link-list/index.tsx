import { CopyButton } from "@/components/link-page/copy-button";
import { PlatformIcon } from "@/components/link-page/platform-icon";
import { RenderedIcon } from "@/components/ui/rendered-icon";
import { getPlatformBrandColor } from "@/lib/platforms";
import { Link2 } from "lucide-react";
import * as React from "react";

type LinkData = {
  copyValue?: null | string;
  icon: null | string;
  id: string;
  platform: null | string;
  slug: string;
  title: string;
  url: string;
};

export type LinkGroup = {
  id: string;
  links: LinkData[];
  slug: null | string;
  title: string;
};

export type LinkListProps = {
  basePath?: string;
  featuredLink?: null | LinkData;
  groups?: LinkGroup[];
  links: LinkData[];
  username: string;
};

export const LinkList: React.FC<LinkListProps> = (props) => {
  const { basePath, featuredLink, groups = [], links, username } = props;

  const linkBasePath = basePath ?? `/${username}`;

  //* Variables
  const hasContent = featuredLink != null || links.length > 0 || groups.some((g) => g.links.length > 0);

  //* Handlers
  const renderLink = (link: LinkData) => {
    const brandColor = link.icon == null && link.platform != null ? getPlatformBrandColor(link.platform) : undefined;

    return (
      <a
        className="border-anc-theme-link-border bg-anc-theme-link-bg flex min-h-[52px] items-center gap-3 rounded-xl border px-4 py-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        href={`${linkBasePath}/${link.slug}`}
        key={link.id}
        rel="noopener noreferrer"
        // eslint-disable-next-line anchr/no-inline-style -- dynamic CSS custom properties for platform accent
        style={
          brandColor != null
            ? ({
                "--anc-platform-accent-dark": brandColor.dark,
                "--anc-platform-accent-light": brandColor.light,
              } as React.CSSProperties)
            : undefined
        }
        target="_blank"
      >
        <div className="lp-link-icon-bg flex size-7 shrink-0 items-center justify-center rounded-lg">
          {link.icon != null && <RenderedIcon className="lp-link-icon-color size-4" iconId={link.icon} />}
          {link.icon == null && link.platform != null && (
            <PlatformIcon className="lp-link-icon-color size-4" platform={link.platform} />
          )}
          {link.icon == null && link.platform == null && (
            <Link2 className="text-anc-theme-link-icon size-4" strokeWidth={1.75} />
          )}
        </div>
        <span className="text-anc-theme-link-text flex-1 truncate text-center text-sm font-medium">{link.title}</span>
        {link.copyValue != null ? <CopyButton value={link.copyValue} /> : <div className="size-7 shrink-0" />}
      </a>
    );
  };

  if (!hasContent) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-2.5">
      {/* Featured link */}
      {featuredLink != null && (
        <a
          className="border-anc-theme-featured-border bg-anc-theme-featured-bg flex min-h-[52px] items-center gap-3 rounded-xl border px-4 py-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          href={`${linkBasePath}/${featuredLink.slug}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <div className="bg-anc-theme-featured-icon-bg flex size-7 shrink-0 items-center justify-center rounded-lg">
            {featuredLink.icon != null && (
              <RenderedIcon className="text-anc-theme-featured-icon size-4" iconId={featuredLink.icon} />
            )}
            {featuredLink.icon == null && featuredLink.platform != null && (
              <PlatformIcon className="text-anc-theme-featured-icon size-4" platform={featuredLink.platform} />
            )}
            {featuredLink.icon == null && featuredLink.platform == null && (
              <Link2 className="text-anc-theme-featured-icon size-4" strokeWidth={1.75} />
            )}
          </div>
          <span className="text-anc-theme-featured-text flex-1 truncate text-center text-sm font-semibold">
            {featuredLink.title}
          </span>
          {featuredLink.copyValue != null ? (
            <CopyButton value={featuredLink.copyValue} />
          ) : (
            <div className="size-7 shrink-0" />
          )}
        </a>
      )}

      {/* Ungrouped links (top) */}
      {links.map(renderLink)}

      {/* Grouped links */}
      {groups.map((group) => {
        if (group.links.length === 0) {
          return null;
        }

        return (
          <React.Fragment key={group.id}>
            {group.slug != null ? (
              <a
                className="text-anc-theme-link-text hover:text-anc-theme-name mt-2 text-center text-sm font-semibold underline-offset-4 transition-colors hover:underline"
                href={`${linkBasePath}/${group.slug}`}
              >
                {group.title}
              </a>
            ) : (
              <h2 className="text-anc-theme-link-text mt-2 text-center text-sm font-semibold">{group.title}</h2>
            )}
            {group.links.map(renderLink)}
          </React.Fragment>
        );
      })}
    </div>
  );
};
