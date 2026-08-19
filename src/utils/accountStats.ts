import type { AppData } from '@/types/models';

// Live, always-correct counterparts to the static Account.openIssues /
// openOpportunities / contactsCount seed fields, which go stale the moment
// an issue, opportunity, or contact is created anywhere in the app (Mobile
// URM, Guided Discovery, etc.). Every screen should read through these
// instead of the static fields so desktop and mobile always agree.

export function openIssueCount(data: AppData, accountId: string): number {
  return data.issues.filter((i) => i.accountId === accountId && i.status !== 'Resolved' && i.status !== 'Closed').length;
}

export function openOpportunityCount(data: AppData, accountId: string): number {
  return data.opportunities.filter((o) => o.accountId === accountId && o.stage !== 'Closed Won' && o.stage !== 'Closed Lost').length;
}

export function contactCount(data: AppData, accountId: string): number {
  return data.contacts.filter((c) => c.accountId === accountId).length;
}
