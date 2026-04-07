import { Anchor } from "lucide-react";
import * as React from "react";

export type FooterProps = {
  hideBranding?: boolean;
  themeToggle?: React.ReactNode;
};

export const Footer: React.FC<FooterProps> = (props) => {
  const { hideBranding, themeToggle } = props;

  if (hideBranding && themeToggle == null) {
    return null;
  }

  return (
    <footer className="anchr-footer border-anc-theme-divider mt-auto grid grid-cols-[1fr_auto_1fr] items-center border-t pt-6 pb-2">
      <div />
      {hideBranding ? (
        <div />
      ) : (
        <a
          className="anchr-brand tracking-anc-caps-wide text-anc-theme-brand flex items-center gap-2 text-xs font-bold uppercase transition-opacity hover:opacity-80"
          href="https://anchr.to?ref=user_page"
          rel="noopener noreferrer"
          target="_blank"
        >
          <Anchor className="size-4" strokeWidth={1.5} />
          {/* eslint-disable anchr/no-raw-string-jsx -- brand name */}
          Anchr
          {/* eslint-enable anchr/no-raw-string-jsx */}
        </a>
      )}
      {themeToggle != null ? <div className="flex justify-end">{themeToggle}</div> : <div />}
    </footer>
  );
};
