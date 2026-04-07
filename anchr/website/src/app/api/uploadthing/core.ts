import { db } from "@/lib/db/client";
import { usersTable } from "@/lib/db/schema/user";
import { isProUser } from "@/lib/tier";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const uploadRouter = {
  avatarUploader: f({ image: { maxFileCount: 1, maxFileSize: "4MB" } })
    .middleware(async () => {
      const { userId } = await auth();

      if (userId == null) {
        throw new UploadThingError("Unauthorized");
      }

      return { userId };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      const [user] = await db
        .update(usersTable)
        .set({ avatarUrl: file.ufsUrl, customAvatar: true, updatedAt: new Date() })
        .where(eq(usersTable.id, metadata.userId))
        .returning({ username: usersTable.username });

      revalidatePath("/dashboard/settings");
      if (user?.username) {
        revalidatePath(`/${user.username}`);
      }

      return { avatarUrl: file.ufsUrl };
    }),
  backgroundImageUploader: f({ image: { maxFileCount: 1, maxFileSize: "4MB" } })
    .middleware(async () => {
      const { userId } = await auth();

      if (userId == null) {
        throw new UploadThingError("Unauthorized");
      }

      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

      if (user == null || !isProUser(user)) {
        throw new UploadThingError("Pro subscription required");
      }

      return { userId };
    })
    .onUploadComplete(async ({ file }) => {
      return { imageUrl: file.ufsUrl };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
