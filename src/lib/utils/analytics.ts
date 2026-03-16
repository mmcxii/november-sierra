export function computeTrendPercent(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return Math.round(((current - previous) / previous) * 100);
}

export function fillDateGaps(
  rows: { clicks: number; date: string }[],
  days: number,
): { clicks: number; date: string }[] {
  const map = new Map(rows.map((r) => [r.date, r.clicks]));
  const result: { clicks: number; date: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ clicks: map.get(key) ?? 0, date: key });
  }

  return result;
}
