import { listMembershipsForUser } from "@/lib/auth/session";
import { challengeDayNumber } from "@/lib/challenge/celebrations";
import { daysUntilStart, localDateString, type ChallengeMode, type MemberStatus } from "@/lib/challenge/tasks";
import { serviceSuccess, type McpUser, type ServiceResult } from "@/lib/mcp/types";

export type TeamSummary = {
  dayNumber: null | number;
  daysUntilStart: number;
  endDate: string;
  isOwner: boolean;
  mode: ChallengeMode;
  startDate: string;
  status: MemberStatus;
  teamId: string;
  teamName: string;
  todayLocal: string;
};

export async function listTeams(user: McpUser): Promise<ServiceResult<{ teams: TeamSummary[]; todayLocal: string }>> {
  const todayLocal = localDateString(new Date(), user.timeZone);
  const memberships = await listMembershipsForUser(user.id);
  const teams = memberships.map((row) => {
    const daysUntil = daysUntilStart(row.team.startDate, todayLocal);
    return {
      dayNumber: daysUntil === 0 ? challengeDayNumber(row.team.startDate, todayLocal) : null,
      daysUntilStart: daysUntil,
      endDate: row.team.endDate,
      isOwner: row.member.isOwner,
      mode: row.member.mode as ChallengeMode,
      startDate: row.team.startDate,
      status: row.member.status as MemberStatus,
      teamId: row.team.id,
      teamName: row.team.name,
      todayLocal,
    };
  });

  return serviceSuccess({ teams, todayLocal });
}
