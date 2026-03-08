import { LinkList } from "@/components/dashboard/link-list";
import { db } from "@/lib/db/client";
import { linksTable } from "@/lib/db/schema/link";
import { auth } from "@clerk/nextjs/server";
import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard",
};

const DashboardPage: React.FC = async () => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const links = await db
    .select()
    .from(linksTable)
    .where(eq(linksTable.userId, userId))
    .orderBy(asc(linksTable.position));

  return (
    <div className="mx-auto w-full max-w-2xl">
      <LinkList links={links} />
    </div>
  );
};

export default DashboardPage;
