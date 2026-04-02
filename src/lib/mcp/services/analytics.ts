import type { ApiKeyUser } from "@/lib/api/auth";
import { db } from "@/lib/db/client";
import { clicksTable } from "@/lib/db/schema/click";
import { linksTable } from "@/lib/db/schema/link";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { serviceSuccess, type ServiceResult } from "../types";
import { requirePro } from "./require-pro";

export type DateRange = { end?: null | string; start?: null | string };

export type AnalyticsSummary = {
  topCountry: null | string;
  topLink: null | string;
  totalClicks: number;
};

export type LinkAnalyticsRow = {
  clicks: number;
  linkId: string;
  slug: string;
  title: string;
};

export type ReferrerRow = {
  clicks: number;
  referrer: null | string;
};

export type DeviceAnalytics = {
  browsers: { browser: null | string; clicks: number }[];
  devices: { clicks: number; device: null | string }[];
  operatingSystems: { clicks: number; os: null | string }[];
};

export type ClickHistoryRow = {
  clicks: number;
  date: string;
};

function parseDateRange(range?: DateRange): { end: null | Date; start: null | Date } {
  let start: null | Date = null;
  let end: null | Date = null;

  if (range?.start != null) {
    const d = new Date(range.start);
    if (!isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      start = d;
    }
  }

  if (range?.end != null) {
    const d = new Date(range.end);
    if (!isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      end = d;
    }
  }

  return { end, start };
}

function buildDateConditions(userId: string, start: null | Date, end: null | Date) {
  const conditions = [eq(clicksTable.userId, userId)];
  if (start != null) {
    conditions.push(gte(clicksTable.createdAt, start));
  }
  if (end != null) {
    conditions.push(lte(clicksTable.createdAt, end));
  }
  return conditions;
}

export async function getAnalytics(user: ApiKeyUser, range?: DateRange): Promise<ServiceResult<AnalyticsSummary>> {
  const proError = requirePro(user);
  if (proError != null) {
    return proError;
  }

  const { end, start } = parseDateRange(range);
  const conditions = and(...buildDateConditions(user.id, start, end));

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

  return serviceSuccess({
    topCountry: topCountryResult[0]?.country ?? null,
    topLink: topLinkResult[0]?.title ?? null,
    totalClicks: clickResult[0]?.totalClicks ?? 0,
  });
}

export async function getLinkAnalytics(
  user: ApiKeyUser,
  range?: DateRange,
): Promise<ServiceResult<LinkAnalyticsRow[]>> {
  const proError = requirePro(user);
  if (proError != null) {
    return proError;
  }

  const { end, start } = parseDateRange(range);
  const conditions = and(...buildDateConditions(user.id, start, end));

  const rows = await db
    .select({
      clicks: count(),
      linkId: linksTable.id,
      slug: linksTable.slug,
      title: linksTable.title,
    })
    .from(clicksTable)
    .innerJoin(linksTable, eq(clicksTable.linkId, linksTable.id))
    .where(conditions)
    .groupBy(linksTable.id, linksTable.title, linksTable.slug)
    .orderBy(desc(count()));

  return serviceSuccess(rows);
}

export async function getReferrerAnalytics(user: ApiKeyUser, range?: DateRange): Promise<ServiceResult<ReferrerRow[]>> {
  const proError = requirePro(user);
  if (proError != null) {
    return proError;
  }

  const { end, start } = parseDateRange(range);
  const dateConditions = buildDateConditions(user.id, start, end);
  dateConditions.push(sql`${clicksTable.referrer} is not null`);

  const rows = await db
    .select({ clicks: count(), referrer: clicksTable.referrer })
    .from(clicksTable)
    .where(and(...dateConditions))
    .groupBy(clicksTable.referrer)
    .orderBy(desc(count()));

  return serviceSuccess(rows);
}

export async function getDeviceAnalytics(user: ApiKeyUser, range?: DateRange): Promise<ServiceResult<DeviceAnalytics>> {
  const proError = requirePro(user);
  if (proError != null) {
    return proError;
  }

  const { end, start } = parseDateRange(range);
  const conditions = and(...buildDateConditions(user.id, start, end));

  const [browsers, devices, operatingSystems] = await Promise.all([
    db
      .select({ browser: clicksTable.browser, clicks: count() })
      .from(clicksTable)
      .where(conditions)
      .groupBy(clicksTable.browser)
      .orderBy(desc(count())),

    db
      .select({ clicks: count(), device: clicksTable.device })
      .from(clicksTable)
      .where(conditions)
      .groupBy(clicksTable.device)
      .orderBy(desc(count())),

    db
      .select({ clicks: count(), os: clicksTable.os })
      .from(clicksTable)
      .where(conditions)
      .groupBy(clicksTable.os)
      .orderBy(desc(count())),
  ]);

  return serviceSuccess({ browsers, devices, operatingSystems });
}

export async function getClickHistory(user: ApiKeyUser, range?: DateRange): Promise<ServiceResult<ClickHistoryRow[]>> {
  const proError = requirePro(user);
  if (proError != null) {
    return proError;
  }

  const { end, start } = parseDateRange(range);
  const dateConditions = buildDateConditions(user.id, start, end);

  const dateExpr = sql<string>`to_char(${clicksTable.createdAt}, 'YYYY-MM-DD')`;

  const rows = await db
    .select({ clicks: count(), date: dateExpr })
    .from(clicksTable)
    .where(and(...dateConditions))
    .groupBy(dateExpr)
    .orderBy(dateExpr);

  return serviceSuccess(rows);
}
