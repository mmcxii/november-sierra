import { fillDateGaps } from "@/lib/utils/analytics";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
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
    .select({ clicks: count(), slug: linksTable.slug, title: linksTable.title })
    .from(clicksTable)
    .innerJoin(linksTable, eq(clicksTable.linkId, linksTable.id))
    .where(conditions)
    .groupBy(linksTable.title, linksTable.slug)
    .orderBy(desc(count()))
    .limit(10);
}

export async function getDeviceStats(userId: string, range: DateRange) {
  const dateFilter = rangeFilter(range);
  const conditions =
    dateFilter != null ? and(eq(clicksTable.userId, userId), dateFilter) : eq(clicksTable.userId, userId);

  return db
    .select({ count: count(), device: clicksTable.device })
    .from(clicksTable)
    .where(conditions)
    .groupBy(clicksTable.device)
    .orderBy(desc(count()));
}

export async function getLocationStats(userId: string, range: DateRange) {
  const dateFilter = rangeFilter(range);
  const conditions =
    dateFilter != null ? and(eq(clicksTable.userId, userId), dateFilter) : eq(clicksTable.userId, userId);

  return db
    .select({ count: count(), country: clicksTable.country })
    .from(clicksTable)
    .where(and(conditions, sql`${clicksTable.country} is not null`))
    .groupBy(clicksTable.country)
    .orderBy(desc(count()))
    .limit(10);
}
