import { LinkList } from "@/components/dashboard/link-list";
import { PagePreview } from "@/components/dashboard/page-preview";
import { PreviewToggle } from "@/components/dashboard/preview-toggle";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { linksTable } from "@/lib/db/schema/link";
import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import * as React from "react";

export const metadata: Metadata = {
  title: "Dashboard",
};

const DashboardPage: React.FC = async () => {
  //* Variables
  const user = await requireUser();
  const links = await db
    .select()
    .from(linksTable)
    .where(eq(linksTable.userId, user.id))
    .orderBy(asc(linksTable.position));

  return (
    <div className="flex gap-8">
      {/* Link management */}
      <div className="min-w-0 flex-1">
        {/* Mobile preview button */}
        <div className="mb-4 flex justify-end xl:hidden">
          <PreviewToggle>
            <PagePreview links={links} user={user} />
          </PreviewToggle>
        </div>

        <LinkList links={links} />
      </div>

      {/* Desktop preview panel */}
      <aside className="hidden w-72 shrink-0 xl:block">
        <div className="sticky top-6">
          <PagePreview links={links} user={user} />
        </div>
      </aside>
    </div>
  );
};

export default DashboardPage;
