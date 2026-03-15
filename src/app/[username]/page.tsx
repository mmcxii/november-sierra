import { getCardTheme } from "@/components/dashboard/page-preview/utils";
import { Footer } from "@/components/link-page/footer";
import { LinkList } from "@/components/link-page/link-list";
import { ProfileHeader } from "@/components/link-page/profile-header";
import { ThemeProvider } from "@/components/link-page/theme-provider";
import { db } from "@/lib/db/client";
import { linksTable } from "@/lib/db/schema/link";
import { usersTable } from "@/lib/db/schema/user";
import { and, asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import * as React from "react";

export const revalidate = 60;
export const dynamicParams = true;

type Params = { username: string };

async function getPageData(username: string) {
  const users = await db.select().from(usersTable).where(eq(usersTable.username, username.toLowerCase())).limit(1);

  const user = users[0];

  if (user == null) {
    return null;
  }

  const links = await db
    .select({ id: linksTable.id, title: linksTable.title, url: linksTable.url })
    .from(linksTable)
    .where(and(eq(linksTable.userId, user.id), eq(linksTable.visible, true)))
    .orderBy(asc(linksTable.position));

  return { links, user };
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const { username } = await props.params;
  const data = await getPageData(username);

  if (data == null) {
    return { title: "Not Found" };
  }

  const { user } = data;
  const name = user.displayName ?? user.username;

  return {
    description: user.bio ?? `Check out ${name}'s links on Anchr.`,
    openGraph: {
      description: user.bio ?? `Check out ${name}'s links on Anchr.`,
      title: `${name} (@${user.username})`,
      type: "profile",
      url: `https://anchr.to/${user.username}`,
    },
    title: `${name} (@${user.username})`,
    twitter: {
      card: "summary_large_image",
      description: user.bio ?? `Check out ${name}'s links on Anchr.`,
      title: `${name} (@${user.username})`,
    },
  };
}

export type UserPageProps = {
  params: Promise<Params>;
};

const UserPage: React.FC<UserPageProps> = async (props) => {
  const { params } = props;

  //* Variables
  const { username } = await params;
  const data = await getPageData(username);

  if (data == null) {
    notFound();
  }

  const { links, user } = data;
  const theme = getCardTheme(user.theme);

  return (
    <ThemeProvider theme={theme}>
      {/* Hairline accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,color-mix(in_srgb,var(--_mc-hairline)_60%,transparent),transparent)]" />

      {/* Radial glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-[var(--_mc-glow-bg)] opacity-25 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-6 px-5 pt-10 pb-8">
        <ProfileHeader avatarUrl={user.avatarUrl} displayName={user.displayName} username={user.username} />
        <LinkList links={links} />
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default UserPage;
