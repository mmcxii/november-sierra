import { Link2 } from "lucide-react";
import * as React from "react";

export type LinkListProps = {
  links: { id: string; title: string; url: string }[];
};

export const LinkList: React.FC<LinkListProps> = (props) => {
  const { links } = props;

  if (links.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-2.5">
      {links.map((link) => (
        <a
          className="flex min-h-[52px] items-center gap-3 rounded-xl border border-[var(--_mc-link-border)] bg-[var(--_mc-link-bg)] px-4 py-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          href={link.url}
          key={link.id}
          rel="noopener noreferrer"
          target="_blank"
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--_mc-link-icon-bg)]">
            <Link2 className="size-4 text-[var(--_mc-link-icon-color)]" strokeWidth={1.75} />
          </div>
          <span className="flex-1 truncate text-center text-sm font-medium text-[var(--_mc-link-text)]">
            {link.title}
          </span>
          <div className="size-7 shrink-0" />
        </a>
      ))}
    </div>
  );
};
