import type { TFunction } from "i18next";

export type AiChatPreviewProps = {
  t: TFunction;
};

/**
 * Two-turn AI chat mockup for the AI-ready card. Demonstrates a user asking
 * an agent to shorten a URL, and the agent responding with a clickable pill.
 *
 * The `anch.to/0r1ck` pill is a real `<a>` — clicking navigates to a YouTube
 * Rick Roll. The slug spells "0-R-1-C-K" (leet-speak "rick") which foreshadows
 * the joke for anyone who squints at the URL before clicking. Opens in a new
 * tab (`target="_blank"`, `rel="noopener noreferrer"`) so the visitor doesn't
 * lose the landing page to the detour.
 */
export const AiChatPreview: React.FC<AiChatPreviewProps> = (props) => {
  const { t } = props;

  return (
    <div className="mt-4 flex flex-col gap-2">
      {/* User turn */}
      <div className="flex justify-end">
        <div className="m-accent-bg m-page-bg-color max-w-[220px] rounded-2xl rounded-br-sm px-3 py-1.5 text-[11px]">
          {/* eslint-disable-next-line november-sierra/no-raw-string-jsx -- mock URL in user prompt */}
          {"Shorten https://store.example.com/summer-sale"}
        </div>
      </div>

      {/* Assistant turn */}
      <div className="flex justify-start">
        <div className="m-card-bg-bg m-muted-12-border flex max-w-[260px] flex-col gap-1.5 rounded-2xl rounded-bl-sm border px-3 py-1.5 text-[11px]">
          <span className="m-muted-70">{t("hereYouGo")}</span>
          <a
            className="m-accent-60-color m-accent-05-bg m-accent-18-border w-fit rounded-md border px-2 py-0.5 font-mono text-[11px] underline-offset-2 hover:underline"
            href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            rel="noopener noreferrer"
            target="_blank"
          >
            {/* eslint-disable-next-line november-sierra/no-raw-string-jsx -- mock short URL easter-egg */}
            {"anch.to/0r1ck"}
          </a>
        </div>
      </div>
    </div>
  );
};
