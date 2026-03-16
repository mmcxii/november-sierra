import { db } from "@/lib/db/client";
import { clicksTable } from "@/lib/db/schema/click";
import { linksTable } from "@/lib/db/schema/link";
import { usersTable } from "@/lib/db/schema/user";
import { and, eq } from "drizzle-orm";
import { after, type NextRequest, NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";

type Params = { slug: string; username: string };

export async function GET(request: NextRequest, props: { params: Promise<Params> }): Promise<NextResponse> {
  const { slug, username } = await props.params;

  const results = await db
    .select({
      id: linksTable.id,
      url: linksTable.url,
      userId: linksTable.userId,
      visible: linksTable.visible,
    })
    .from(linksTable)
    .innerJoin(usersTable, eq(linksTable.userId, usersTable.id))
    .where(and(eq(usersTable.username, username.toLowerCase()), eq(linksTable.slug, slug.toLowerCase())))
    .limit(1);

  const link = results[0];

  // If link not found or not visible, redirect to user's profile page
  if (link == null || !link.visible) {
    return NextResponse.redirect(new URL(`/${username}`, request.url), 302);
  }

  after(async () => {
    const ua = new UAParser(request.headers.get("user-agent") ?? "");
    const deviceType = ua.getDevice().type;

    await db.insert(clicksTable).values({
      browser: ua.getBrowser().name ?? null,
      city: request.headers.get("x-vercel-ip-city") ?? null,
      country: request.headers.get("x-vercel-ip-country") ?? null,
      device: deviceType === "mobile" ? "mobile" : deviceType === "tablet" ? "tablet" : "desktop",
      linkId: link.id,
      os: ua.getOS().name ?? null,
      referrer: request.headers.get("referer") ?? null,
      userId: link.userId,
    });
  });

  return NextResponse.redirect(link.url, 302);
}
