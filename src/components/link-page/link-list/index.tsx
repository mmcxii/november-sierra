import { PlatformIcon } from "@/components/link-page/platform-icon";
import { Link2 } from "lucide-react";
import * as React from "react";

export type LinkListProps = {
  links: { id: string; platform: null | string; slug: string; title: string; url: string }[];
  username: string;
};

export const LinkList: React.FC<LinkListProps> = (props) => {
  const { links, username } = props;

  if (links.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-2.5">
      {links.map((link) => (
        <a
          className="border-anc-theme-link-border bg-anc-theme-link-bg flex min-h-[52px] items-center gap-3 rounded-xl border px-4 py-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          href={`/${username}/${link.slug}`}
          key={link.id}
          rel="noopener noreferrer"
          target="_blank"
        >
          <div className="bg-anc-theme-link-icon-bg flex size-7 shrink-0 items-center justify-center rounded-lg">
            {link.platform != null ? (
              <PlatformIcon className="text-anc-theme-link-icon size-4" platform={link.platform} />
            ) : (
              <Link2 className="text-anc-theme-link-icon size-4" strokeWidth={1.75} />
            )}
          </div>
          <span className="text-anc-theme-link-text flex-1 truncate text-center text-sm font-medium">{link.title}</span>
          <div className="size-7 shrink-0" />
        </a>
      ))}
    </div>
  );
};
