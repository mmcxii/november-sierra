import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initTranslations } from "@/lib/i18n/server";
import * as React from "react";

export type LocationListProps = {
  locations: { count: number; country: null | string }[];
};

export const LocationList: React.FC<LocationListProps> = async (props) => {
  const { locations } = props;

  const { t } = await initTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{t("topLocations")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {locations.map((loc) => (
            <div className="flex items-center justify-between text-sm" key={loc.country}>
              <span>{loc.country ?? "—"}</span>
              <span className="text-muted-foreground">
                {loc.count} {t("clicks")}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
