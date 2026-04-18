import { cardBase, cardClasses, cardHoverClass } from "@/components/marketing/features/card-styles";
import { IconHeader } from "@/components/marketing/features/icon-header";
import { Container } from "@/components/ui/container";
import type { TranslationKey } from "@/lib/i18n/i18next.d";
import { cn } from "@/lib/utils";
import type { TFunction } from "i18next";
import { BarChart3, Bot, Clock, Link as LinkIcon, Lock, Target } from "lucide-react";
import { AiChatPreview } from "./ai-chat-preview";
import { AnalyticsMiniChart } from "./analytics-mini-chart";
import { ExpiryCountdown } from "./expiry-countdown";
import { PathRotator } from "./path-rotator";
import { UnlockFormPreview } from "./unlock-form-preview";
import { UtmChain } from "./utm-chain";

export type ShortLinksFeaturesGridProps = {
  t: TFunction;
};

type Card = {
  body: TranslationKey;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: TranslationKey;
  visual: React.ReactNode;
};

export const ShortLinksFeaturesGrid: React.FC<ShortLinksFeaturesGridProps> = (props) => {
  const { t } = props;

  const cards: Card[] = [
    {
      body: "nameYourPathsHostShortUrlsOnYourOwnDomain",
      icon: LinkIcon,
      title: "pathsAndDomainsYourCall",
      visual: <PathRotator />,
    },
    {
      body: "gateAnyLinkBehindASharedPassword",
      icon: Lock,
      title: "passwordProtection",
      visual: <UnlockFormPreview />,
    },
    {
      body: "setAnExpiryDateShortUrlsRetireThemselves",
      icon: Clock,
      title: "expiringLinks",
      visual: <ExpiryCountdown />,
    },
    {
      body: "buildCampaignTaggedUrlsWithoutHandTypingQueryStrings",
      icon: Target,
      title: "utmBuilder",
      visual: <UtmChain />,
    },
    {
      body: "everyClickTrackedBySourceProfileShortUrlOrDirect",
      icon: BarChart3,
      title: "clickAnalytics",
      visual: <AnalyticsMiniChart />,
    },
    {
      body: "createAndManageShortUrlsFromYourAiAssistant",
      icon: Bot,
      title: "aiReady",
      visual: <AiChatPreview t={t} />,
    },
  ];

  return (
    <Container as="section" className="py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div className={cn(cardBase, cardClasses, cardHoverClass, "flex h-full flex-col p-6")} key={card.title}>
              <div className="m-accent-gradient-bg absolute inset-x-0 top-0 h-px" />
              <IconHeader icon={card.icon} title={t(card.title)} />
              <p className="m-muted-70 text-sm leading-relaxed">{t(card.body)}</p>
              {card.visual}
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
};
