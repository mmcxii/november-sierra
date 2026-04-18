import { Container } from "@/components/ui/container";
import type { TFunction } from "i18next";
import { Anchor } from "lucide-react";
import { Cell } from "./cell";
import { ROWS, VERIFIED_DATE } from "./constants";

export type ShortLinksComparisonProps = {
  t: TFunction;
};

export const ShortLinksComparison: React.FC<ShortLinksComparisonProps> = (props) => {
  const { t } = props;

  return (
    <Container as="section" className="py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-4 text-center text-2xl font-bold tracking-tight sm:text-3xl">{t("chartTheDifference")}</h2>
        <p className="m-muted-70 mx-auto mb-10 max-w-2xl text-center text-base leading-relaxed sm:text-lg">
          {t("anchrGivesYouEverythingMostShortenersGateBehindHigherTiersAndAFewThingsTheyDontOfferAtAll")}
        </p>

        <div className="m-card-bg-bg m-card-border overflow-hidden rounded-2xl">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-4 text-left text-xs font-semibold tracking-wider uppercase">{t("feature")}</th>
                <th className="m-accent-05-bg px-4 py-4 text-center text-sm font-bold">
                  <span className="inline-flex items-center gap-1.5">
                    <Anchor className="m-accent-60-color size-4" strokeWidth={2} />
                    <span className="m-accent-60-color">{t("anchr")}</span>
                  </span>
                </th>
                <th className="m-muted-50 px-4 py-4 text-center text-xs font-medium tracking-wider uppercase">
                  {/* eslint-disable-next-line november-sierra/no-raw-string-jsx -- competitor brand name */}
                  {"Bitly"}
                </th>
                <th className="m-muted-50 px-4 py-4 text-center text-xs font-medium tracking-wider uppercase">
                  {/* eslint-disable-next-line november-sierra/no-raw-string-jsx -- competitor brand name */}
                  {"TinyURL"}
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr className="border-b border-white/10 last:border-b-0" key={row.feature}>
                  <td className="px-4 py-3 text-sm font-medium">{t(row.feature)}</td>
                  <td className="m-accent-05-bg px-4 py-3 text-center">
                    <Cell cell={row.anchr} isAnchr t={t} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Cell cell={row.bitly} isAnchr={false} t={t} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Cell cell={row.tinyurl} isAnchr={false} t={t} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="m-muted-50 mt-4 text-center text-xs">
          {t("anchr$7MoProOrFreeForeverPricingAndFeatureAvailabilityVerified{{date}}", { date: VERIFIED_DATE })}
        </p>
      </div>
    </Container>
  );
};
