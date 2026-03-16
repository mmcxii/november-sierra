import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initTranslations } from "@/lib/i18n/server";
import { Globe, MousePointerClick, Trophy } from "lucide-react";
import * as React from "react";

export type SummaryCardsProps = {
  topCountry: null | string;
  topLinkTitle: null | string;
  totalClicks: number;
};

export const SummaryCards: React.FC<SummaryCardsProps> = async (props) => {
  const { topCountry, topLinkTitle, totalClicks } = props;

  const { t } = await initTranslations();

  const cards = [
    { icon: MousePointerClick, label: t("totalClicks"), value: totalClicks.toLocaleString() },
    { icon: Trophy, label: t("topLink"), value: topLinkTitle ?? "—" },
    { icon: Globe, label: t("topCountry"), value: topCountry ?? "—" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <card.icon className="text-muted-foreground size-4" />
              <CardTitle className="text-muted-foreground text-sm font-medium">{card.label}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="truncate text-2xl font-bold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
