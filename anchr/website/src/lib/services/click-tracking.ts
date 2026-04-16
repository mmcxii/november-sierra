import { db } from "@/lib/db/client";
import { clicksTable } from "@/lib/db/schema/click";
import { UAParser } from "ua-parser-js";

function resolveDeviceType(type: undefined | string): string {
  if (type === "mobile") {return "mobile";}
  if (type === "tablet") {return "tablet";}
  return "desktop";
}

export async function recordClick(
  headerList: Headers,
  params: {
    linkId?: string;
    shortLinkId?: string;
    source: string;
    userId: string;
  },
): Promise<void> {
  const ua = new UAParser(headerList.get("user-agent") ?? "");
  await db.insert(clicksTable).values({
    browser: ua.getBrowser().name ?? null,
    city: headerList.get("x-vercel-ip-city") ?? null,
    country: headerList.get("x-vercel-ip-country") ?? null,
    device: resolveDeviceType(ua.getDevice().type),
    linkId: params.linkId ?? null,
    os: ua.getOS().name ?? null,
    referrer: headerList.get("referer") ?? null,
    shortLinkId: params.shortLinkId ?? null,
    source: params.source,
    userId: params.userId,
  });
}
