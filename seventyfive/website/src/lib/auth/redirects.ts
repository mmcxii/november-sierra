import { pickHomeTeam } from "@/lib/auth/home-team";
import { getAuthUser, listMembershipsForUser } from "@/lib/auth/session";

/** Signed-in landing: team closest to finishing (earliest start), else /teams. */
export async function resolveSignedInHomePath(): Promise<string> {
  const user = await getAuthUser();
  if (user == null) {
    return "/";
  }
  const memberships = await listMembershipsForUser(user.id);
  const home = pickHomeTeam(memberships);
  if (home == null) {
    return "/teams";
  }
  return `/teams/${home.team.id}`;
}
