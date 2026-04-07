import { AdminContent } from "@/components/dashboard/admin-content";
import { isAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { referralCodesTable } from "@/lib/db/schema/referral-code";
import { referralRedemptionsTable } from "@/lib/db/schema/referral-redemption";
import { usersTable } from "@/lib/db/schema/user";
import { initTranslations } from "@/lib/i18n/server";
import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import * as React from "react";

export const metadata: Metadata = {
  title: "Admin",
};

const AdminPage: React.FC = async () => {
  const user = await requireUser();

  if (!isAdmin(user.id)) {
    redirect("/dashboard");
  }

  const { t } = await initTranslations();

  const codes = await db
    .select()
    .from(referralCodesTable)
    .where(eq(referralCodesTable.type, "admin"))
    .orderBy(desc(referralCodesTable.createdAt));

  const redemptions = await db
    .select({
      codeId: referralRedemptionsTable.codeId,
      createdAt: referralRedemptionsTable.createdAt,
      username: usersTable.username,
    })
    .from(referralRedemptionsTable)
    .innerJoin(usersTable, eq(referralRedemptionsTable.userId, usersTable.id))
    .innerJoin(referralCodesTable, eq(referralRedemptionsTable.codeId, referralCodesTable.id))
    .where(eq(referralCodesTable.type, "admin"));

  const redemptionsByCode = new Map<string, Array<{ createdAt: Date; username: string }>>();

  for (const r of redemptions) {
    const existing = redemptionsByCode.get(r.codeId) ?? [];
    existing.push({ createdAt: r.createdAt, username: r.username });
    redemptionsByCode.set(r.codeId, existing);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("admin")}</h1>
      <AdminContent
        codes={codes.map((code) => ({
          ...code,
          redemptions: redemptionsByCode.get(code.id) ?? [],
        }))}
      />
    </div>
  );
};

export default AdminPage;
