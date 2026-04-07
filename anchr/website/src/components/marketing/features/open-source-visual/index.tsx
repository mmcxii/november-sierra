import Link from "next/link";
import { useTranslation } from "react-i18next";
import { GITHUB_REPO_URL } from "./constants";

export const OpenSourceVisual: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="mt-5 space-y-3">
      {/* Branch diagram */}
      <div className="m-embed-bg-bg m-embed-border overflow-hidden rounded-xl p-4">
        <svg className="h-[52px] w-full" fill="none" viewBox="0 0 240 52">
          {/* Main branch line */}
          <line stroke="rgb(var(--m-accent))" strokeLinecap="round" strokeWidth="2" x1="16" x2="224" y1="16" y2="16" />

          {/* Feature branch — diverge and merge */}
          <path
            d="M64 16 C72 16, 76 36, 88 36 L152 36 C164 36, 168 16, 176 16"
            stroke="rgb(var(--m-accent))"
            strokeLinecap="round"
            strokeOpacity="0.45"
            strokeWidth="2"
          />

          {/* Commit dots on main */}
          <circle cx="32" cy="16" fill="rgb(var(--m-accent))" r="3.5" />
          <circle cx="64" cy="16" fill="rgb(var(--m-accent))" r="3.5" />
          <circle cx="120" cy="16" fill="rgb(var(--m-accent))" r="3.5" />
          <circle cx="176" cy="16" fill="rgb(var(--m-accent))" r="3.5" />
          <circle cx="208" cy="16" fill="rgb(var(--m-accent))" r="3.5" />

          {/* Commit dots on feature branch */}
          <circle cx="100" cy="36" fill="rgb(var(--m-accent))" fillOpacity="0.45" r="3" />
          <circle cx="140" cy="36" fill="rgb(var(--m-accent))" fillOpacity="0.45" r="3" />
        </svg>
      </div>

      {/* GitHub link */}
      <Link
        className="m-muted-40 inline-flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
        href={GITHUB_REPO_URL}
        rel="noopener noreferrer"
        target="_blank"
      >
        {t("viewOnGithub")}
        {/* eslint-disable-next-line anchr/no-raw-string-jsx -- decorative arrow in link */}
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </div>
  );
};
