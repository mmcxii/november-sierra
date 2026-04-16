import { fillDateGaps } from "@/lib/utils/analytics";
import { and, count, desc, eq, gte, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "../client";
import { clicksTable } from "../schema/click";
import { linksTable } from "../schema/link";

export type DateRange = "30d" | "7d" | "all";

function getStartDate(range: DateRange): null | Date {
  if (range === "all") {
    return null;
  }
  const days = range === "7d" ? 7 : 30;
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function rangeFilter(range: DateRange) {
  const start = getStartDate(range);
  return start != null ? gte(clicksTable.createdAt, start) : undefined;
}

export async function getAnalyticsSummary(userId: string, range: DateRange) {
  const dateFilter = rangeFilter(range);
  const conditions =
    dateFilter != null ? and(eq(clicksTable.userId, userId), dateFilter) : eq(clicksTable.userId, userId);

  const [clickResult, topLinkResult, topCountryResult] = await Promise.all([
    db.select({ totalClicks: count() }).from(clicksTable).where(conditions),

    db
      .select({ clicks: count(), title: linksTable.title })
      .from(clicksTable)
      .innerJoin(linksTable, eq(clicksTable.linkId, linksTable.id))
      .where(conditions)
      .groupBy(linksTable.title)
      .orderBy(desc(count()))
      .limit(1),

    db
      .select({ clicks: count(), country: clicksTable.country })
      .from(clicksTable)
      .where(and(conditions, sql`${clicksTable.country} is not null`))
      .groupBy(clicksTable.country)
      .orderBy(desc(count()))
      .limit(1),
  ]);

  return {
    topCountry: topCountryResult[0]?.country ?? null,
    topLinkTitle: topLinkResult[0]?.title ?? null,
    totalClicks: clickResult[0]?.totalClicks ?? 0,
  };
}

export async function getClickHistory(userId: string, range: DateRange) {
  const dateFilter = rangeFilter(range);
  const conditions =
    dateFilter != null ? and(eq(clicksTable.userId, userId), dateFilter) : eq(clicksTable.userId, userId);

  const dateExpr = sql<string>`to_char(${clicksTable.createdAt}, 'YYYY-MM-DD')`;

  const rows = await db
    .select({ clicks: count(), date: dateExpr })
    .from(clicksTable)
    .where(conditions)
    .groupBy(dateExpr)
    .orderBy(dateExpr);

  if (range === "all") {
    return rows;
  }
  const days = range === "7d" ? 7 : 30;
  return fillDateGaps(rows, days);
}

export async function getTopLinks(userId: string, range: DateRange) {
  const dateFilter = rangeFilter(range);
  const conditions =
    dateFilter != null ? and(eq(clicksTable.userId, userId), dateFilter) : eq(clicksTable.userId, userId);

  return db
    .select({ clicks: count(), linkId: linksTable.id, slug: linksTable.slug, title: linksTable.title })
    .from(clicksTable)
    .innerJoin(linksTable, eq(clicksTable.linkId, linksTable.id))
    .where(conditions)
    .groupBy(linksTable.id, linksTable.title, linksTable.slug)
    .orderBy(desc(count()));
}

export async function getPreviousPeriodClicks(userId: string, range: DateRange) {
  if (range === "all") {
    return { totalClicks: 0 };
  }

  const days = range === "7d" ? 7 : 30;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() - days);

  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - days);

  const rows = await db
    .select({ totalClicks: count() })
    .from(clicksTable)
    .where(
      and(
        eq(clicksTable.userId, userId),
        gte(clicksTable.createdAt, periodStart),
        lt(clicksTable.createdAt, periodEnd),
      ),
    );

  return { totalClicks: rows[0]?.totalClicks ?? 0 };
}

export async function getPerLinkSparklines(userId: string) {
  const start = new Date();
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);

  const dateExpr = sql<string>`to_char(${clicksTable.createdAt}, 'YYYY-MM-DD')`;

  return db
    .select({ clicks: count(), date: dateExpr, linkId: clicksTable.linkId })
    .from(clicksTable)
    .where(and(eq(clicksTable.userId, userId), isNotNull(clicksTable.linkId), gte(clicksTable.createdAt, start)))
    .groupBy(clicksTable.linkId, dateExpr)
    .orderBy(dateExpr);
}

export async function getPerLinkTrends(userId: string, range: DateRange) {
  if (range === "all") {
    return [];
  }

  const days = range === "7d" ? 7 : 30;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - days);

  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - days);

  const rows = await db
    .select({
      clicks: sql<number>`count(*) filter (where ${clicksTable.createdAt} >= ${currentStart})`,
      linkId: clicksTable.linkId,
      previousClicks: sql<number>`count(*) filter (where ${clicksTable.createdAt} < ${currentStart})`,
    })
    .from(clicksTable)
    .where(
      and(eq(clicksTable.userId, userId), isNotNull(clicksTable.linkId), gte(clicksTable.createdAt, previousStart)),
    )
    .groupBy(clicksTable.linkId);

  return rows;
}
