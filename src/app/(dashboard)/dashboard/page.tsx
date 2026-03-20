import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { PagePreview } from "@/components/dashboard/page-preview";
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

  const previewKey = links.map((l) => `${l.id}:${l.position}:${l.visible}:${l.title}:${l.url}:${l.slug}`).join();

  return (
    <div className="flex gap-8">
      {/* Link management */}
      <div className="min-w-0 flex-1">
        <DashboardContent links={links} previewKey={previewKey} user={user} />
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
