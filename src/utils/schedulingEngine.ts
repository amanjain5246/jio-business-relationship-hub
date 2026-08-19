import type { AppData, CalendarRecord } from '@/types/models';

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Other still-scheduled meetings for the same account or owner whose time window overlaps this one. */
export function findSchedulingConflicts(
  data: AppData,
  params: { accountId: string; owner: string; date: string; time: string; durationMins: number; excludeId?: string },
): CalendarRecord[] {
  if (!params.date || !params.time) return [];
  const startA = timeToMinutes(params.time);
  const endA = startA + params.durationMins;

  return data.calendar.filter((c) => {
    if (c.status !== 'Scheduled') return false;
    if (c.id === params.excludeId) return false;
    if (c.date !== params.date) return false;
    const sameAccount = c.accountId === params.accountId;
    const sameOwner = c.owner === params.owner;
    if (!sameAccount && !sameOwner) return false;
    const startB = timeToMinutes(c.time);
    const endB = startB + c.durationMins;
    return startA < endB && startB < endA;
  });
}
