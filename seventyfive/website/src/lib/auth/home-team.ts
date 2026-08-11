export type HomeTeamCandidate = {
  team: {
    endDate: string;
    id: string;
    startDate: string;
  };
};

/**
 * Prefer the team closest to finishing: earliest start date, then earliest end date.
 */
export function pickHomeTeam<T extends HomeTeamCandidate>(memberships: readonly T[]): null | T {
  if (memberships.length === 0) {
    return null;
  }

  let best = memberships[0];
  for (let index = 1; index < memberships.length; index += 1) {
    const candidate = memberships[index];
    if (candidate.team.startDate < best.team.startDate) {
      best = candidate;
      continue;
    }
    if (candidate.team.startDate > best.team.startDate) {
      continue;
    }
    if (candidate.team.endDate < best.team.endDate) {
      best = candidate;
      continue;
    }
    if (candidate.team.endDate > best.team.endDate) {
      continue;
    }
    if (candidate.team.id < best.team.id) {
      best = candidate;
    }
  }
  return best;
}
