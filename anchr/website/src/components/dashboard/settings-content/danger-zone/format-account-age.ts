import { useTranslation } from "react-i18next";

export function formatAccountAge(createdAt: Date, t: ReturnType<typeof useTranslation>["t"]): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(createdAt).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days < 1) {
    return t("lessThanADay");
  }

  if (days < 30) {
    return t("{{count}}Days", { count: days });
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return t("{{count}}Months", { count: months });
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) {
    return t("{{count}}Years", { count: years });
  }
  return t("{{years}}Years{{months}}Months", { months: remainingMonths, years });
}
