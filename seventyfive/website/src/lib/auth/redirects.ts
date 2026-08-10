import { getAuthUser, listMembershipsForUser } from "@/lib/auth/session";

/** Cheapest signed-in landing: only/most-recent team, else /teams. */
export async function resolveSignedInHomePath(): Promise<string> {
  const user = await getAuthUser();
  if (user == null) {
    return "/";
  }
  const memberships = await listMembershipsForUser(user.id);
  if (memberships.length === 0) {
    return "/teams";
  }
  if (memberships.length === 1) {
    return `/teams/${memberships[0].team.id}`;
  }
  return "/teams";
}
