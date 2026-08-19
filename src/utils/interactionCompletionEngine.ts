import type { Account, Customer360, Issue, Opportunity } from '@/types/models';
import { formatDate } from '@/utils/format';

type Sentiment = 'positive' | 'neutral' | 'negative';

// --- Customer 360 sentiment ripple -----------------------------------------

export function sentimentCustomer360Updates(sentiment: Sentiment, c360: Customer360): Partial<Customer360> {
  const updates: Partial<Customer360> = {};

  if (sentiment === 'positive') {
    updates.satisfactionScore = Math.min(100, c360.satisfactionScore + 4);
    updates.engagementTrend = 'up';
  } else if (sentiment === 'negative') {
    updates.satisfactionScore = Math.max(0, c360.satisfactionScore - 6);
    updates.engagementTrend = 'down';
  }
  // neutral sentiment leaves Customer 360 untouched — no noise in the history log.

  return updates;
}

// --- Recommended follow-up window -------------------------------------------

export interface FollowUpRecommendation {
  idealDate: string; // ISO date
  minDays: number;
  maxDays: number;
  reasonLabel: string;
}

export function recommendFollowUpWindow(params: {
  health: Account['health'];
  segment: Account['segment'];
  sentiment: Sentiment;
  hasP1Issue: boolean;
}): FollowUpRecommendation {
  const { health, segment, sentiment, hasP1Issue } = params;
  let minDays: number;
  let maxDays: number;
  const reasons: string[] = [];

  if (health === 'red') {
    minDays = 3;
    maxDays = 7;
    reasons.push('critical account health');
  } else if (health === 'amber') {
    minDays = 7;
    maxDays = 14;
    reasons.push('at-risk account health');
  } else {
    minDays = 30;
    maxDays = 45;
    reasons.push('healthy account cadence');
  }

  if (sentiment === 'negative' && maxDays > 7) {
    minDays = Math.min(minDays, 3);
    maxDays = 7;
    reasons.push('negative interaction sentiment');
  }

  if (hasP1Issue && maxDays > 3) {
    minDays = 1;
    maxDays = 3;
    reasons.push('open P1 issue');
  }

  if (segment === 'Strategic' && maxDays > 30) {
    maxDays = 30;
    reasons.push('strategic account');
  }

  const idealDays = Math.round((minDays + maxDays) / 2);
  const idealDate = new Date(Date.now() + idealDays * 86400000).toISOString().slice(0, 10);

  return {
    idealDate,
    minDays,
    maxDays,
    reasonLabel: reasons.join(', '),
  };
}

export function daysUntilDate(dateISO: string): number {
  const target = new Date(dateISO + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

/** "Significantly late" = booked meaningfully beyond the recommended window, not just past it. */
export function isSignificantlyLate(scheduledDateISO: string, rec: FollowUpRecommendation): boolean {
  if (!scheduledDateISO) return false;
  const scheduledInDays = daysUntilDate(scheduledDateISO);
  const lateBuffer = Math.max(7, Math.round(rec.maxDays * 0.5));
  return scheduledInDays > rec.maxDays + lateBuffer;
}

// --- Create-or-update merge for issues / opportunities raised in a call ----

export function findMatchingOpenIssue(candidateTitle: string, existingOpenIssues: Issue[]): Issue | null {
  const normalized = candidateTitle.trim().toLowerCase();
  return existingOpenIssues.find((i) => i.title.trim().toLowerCase() === normalized) || null;
}

export function findMatchingOpenOpportunity(candidateName: string, existingOpenOpps: Opportunity[]): Opportunity | null {
  const normalized = candidateName.trim().toLowerCase();
  return existingOpenOpps.find((o) => o.name.trim().toLowerCase() === normalized) || null;
}

// --- Customer-facing summary (redacted) -------------------------------------

const RISK_KEYWORDS = [
  'risk', 'escalat', 'churn', 'competitor', 'complain', 'dissatisf', 'critical', 'breach',
  ' p1', ' p2', 'red', 'penalty', 'terminat', 'legal', 'lawsuit', 'default', 'non-compliance',
  'noncompliance', 'health', 'accountability', 'internal', 'confidential',
];

export function isRiskSensitiveText(text: string): boolean {
  const lower = ` ${text.toLowerCase()} `;
  return RISK_KEYWORDS.some((k) => lower.includes(k));
}

export function buildCustomerFacingSummary(input: {
  subject: string;
  commitments: { task: string; dueDate: string }[];
  nextMeeting: { date: string; time: string; purpose: string } | null;
}): string {
  const parts: string[] = [];
  const safeSubject = input.subject.trim() && !isRiskSensitiveText(input.subject) ? input.subject.trim() : 'our recent conversation';
  parts.push(`Thank you for taking the time to discuss "${safeSubject}".`);

  const safeCommitments = input.commitments.filter((c) => c.task.trim() && !isRiskSensitiveText(c.task));
  if (safeCommitments.length > 0) {
    parts.push('Here is a summary of what we agreed to take forward:');
    safeCommitments.forEach((c) => parts.push(`• ${c.task} (by ${formatDate(c.dueDate)})`));
  }

  if (input.nextMeeting?.date) {
    const purposeClause =
      input.nextMeeting.purpose && !isRiskSensitiveText(input.nextMeeting.purpose)
        ? ` to discuss ${input.nextMeeting.purpose}`
        : '';
    parts.push(`We've scheduled our next check-in on ${formatDate(input.nextMeeting.date)} at ${input.nextMeeting.time}${purposeClause}.`);
  }

  parts.push('Please reach out to your relationship manager with any questions in the meantime.');
  return parts.join('\n');
}
