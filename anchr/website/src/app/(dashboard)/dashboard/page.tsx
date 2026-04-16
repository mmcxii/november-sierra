import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { PagePreview } from "@/components/dashboard/page-preview";
import { requireUser } from "@/lib/auth";
import { SHORT_DOMAIN } from "@/lib/constants/short-domain";
import { db } from "@/lib/db/client";
import { ensureQuickLinksGroup } from "@/lib/db/queries/quick-links";
import { linksTable } from "@/lib/db/schema/link";
import { linkGroupsTable } from "@/lib/db/schema/link-group";
import { isProUser } from "@/lib/tier";
import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Dashboard",
};

const DashboardPage: React.FC = async () => {
  //* Variables
  const user = await requireUser();

  if (isProUser(user)) {
    await ensureQuickLinksGroup(user.id);
  }

  const links = await db
    .select()
    .from(linksTable)
    .where(eq(linksTable.userId, user.id))
    .orderBy(asc(linksTable.position));

  const groups = await db
    .select()
    .from(linkGroupsTable)
    .where(eq(linkGroupsTable.userId, user.id))
    .orderBy(asc(linkGroupsTable.position));

  const previewKey = [
    ...links.map(
      (l) => `${l.id}:${l.position}:${l.visible}:${l.title}:${l.url}:${l.slug}:${l.groupId}:${l.icon}:${l.isFeatured}`,
    ),
    ...groups.map((g) => `${g.id}:${g.position}:${g.visible}:${g.title}`),
  ].join();

  return (
    <div className="flex gap-8">
      {/* Link management */}
      <div className="min-w-0 flex-1">
        <DashboardContent
          groups={groups}
          links={links}
          previewKey={previewKey}
          shortDomain={SHORT_DOMAIN}
          user={user}
        />
      </div>

      {/* Desktop preview panel */}
      <aside className="hidden w-72 shrink-0 xl:block">
        <div className="sticky top-6">
          <PagePreview previewKey={previewKey} user={user} />
        </div>
      </aside>
    </div>
  );
};

export default DashboardPage;
