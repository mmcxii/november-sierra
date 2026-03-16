import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initTranslations } from "@/lib/i18n/server";
import * as React from "react";

export type TopLinksTableProps = {
  links: { clicks: number; slug: string; title: string }[];
};

export const TopLinksTable: React.FC<TopLinksTableProps> = async (props) => {
  const { links } = props;

  const { t } = await initTranslations();
  const maxClicks = links[0]?.clicks ?? 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{t("topLinks")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {links.map((link) => (
            <div className="flex flex-col gap-1.5" key={link.slug}>
              <div className="flex items-center justify-between text-sm">
                <span className="truncate font-medium">{link.title}</span>
                <span className="text-muted-foreground ml-2 shrink-0">
                  {link.clicks} {t("clicks")}
                </span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full bg-[var(--color-chart-1)] transition-all"
                  // eslint-disable-next-line anchr/no-inline-style -- dynamic runtime value
                  style={{ width: `${(link.clicks / maxClicks) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
