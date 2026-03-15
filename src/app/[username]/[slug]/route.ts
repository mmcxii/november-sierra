import { db } from "@/lib/db/client";
import { linksTable } from "@/lib/db/schema/link";
import { usersTable } from "@/lib/db/schema/user";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

type Params = { slug: string; username: string };

export async function GET(_request: NextRequest, props: { params: Promise<Params> }): Promise<NextResponse> {
  const { slug, username } = await props.params;

  const results = await db
    .select({ url: linksTable.url, visible: linksTable.visible })
    .from(linksTable)
    .innerJoin(usersTable, eq(linksTable.userId, usersTable.id))
    .where(and(eq(usersTable.username, username.toLowerCase()), eq(linksTable.slug, slug.toLowerCase())))
    .limit(1);

  const link = results[0];

  // If link not found or not visible, redirect to user's profile page
  if (link == null || !link.visible) {
    return NextResponse.redirect(new URL(`/${username}`, _request.url), 302);
  }

  return NextResponse.redirect(link.url, 302);
}
