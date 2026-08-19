import type {
  CustomerExperienceRating,
  AdvocacyStance,
  IssueCategory,
  DiscoverySession,
} from '@/types/models';

const SATISFACTION_BY_RATING: Record<CustomerExperienceRating, number> = {
  'Very Satisfied': 95,
  Satisfied: 80,
  Neutral: 60,
  Dissatisfied: 35,
  'Very Dissatisfied': 15,
};

const TREND_BY_RATING: Record<CustomerExperienceRating, 'up' | 'stable' | 'down'> = {
  'Very Satisfied': 'up',
  Satisfied: 'up',
  Neutral: 'stable',
  Dissatisfied: 'down',
  'Very Dissatisfied': 'down',
};

export function isDissatisfiedRating(rating: CustomerExperienceRating | null): boolean {
  return rating === 'Dissatisfied' || rating === 'Very Dissatisfied';
}

export function satisfactionScoreForRating(rating: CustomerExperienceRating): number {
  return SATISFACTION_BY_RATING[rating];
}

export function engagementTrendForRating(rating: CustomerExperienceRating): 'up' | 'stable' | 'down' {
  return TREND_BY_RATING[rating];
}

export function nudgeNpsForStance(current: number, stance: AdvocacyStance): number {
  if (stance === 'Promoter') return Math.min(100, current + 5);
  if (stance === 'Detractor') return Math.max(-100, current - 10);
  return current;
}

const REASON_TO_CATEGORY: Record<string, IssueCategory> = {
  'Network reliability': 'Network',
  'Billing accuracy': 'Billing',
  'Support responsiveness': 'Service',
  'Product fit': 'Product',
  Pricing: 'Contract',
  'Account management': 'Service',
};

export function categoryForDissatisfactionReasons(reasons: string[]): IssueCategory {
  for (const reason of reasons) {
    if (REASON_TO_CATEGORY[reason]) return REASON_TO_CATEGORY[reason];
  }
  return 'Service';
}

export function buildDefaultKeyFindings(session: {
  interactionType: DiscoverySession['interactionType'];
  experienceRating: CustomerExperienceRating | null;
  dissatisfactionDetails: string;
  businessGrowthPlans: string;
  productOpportunityNotes: string;
  usingCompetitor: boolean | null;
  competitorNames: string[];
  painPoints: string[];
  advocacyStance: AdvocacyStance | null;
}): string {
  const parts: string[] = [];

  if (session.experienceRating) {
    parts.push(`Customer experience: ${session.experienceRating}.`);
  }
  if (session.dissatisfactionDetails.trim()) {
    parts.push(session.dissatisfactionDetails.trim());
  }
  if (session.businessGrowthPlans.trim()) {
    parts.push(`Growth plans: ${session.businessGrowthPlans.trim()}`);
  }
  if (session.productOpportunityNotes.trim()) {
    parts.push(`Product interest: ${session.productOpportunityNotes.trim()}`);
  }
  if (session.usingCompetitor && session.competitorNames.length > 0) {
    parts.push(`Evaluating competitor(s): ${session.competitorNames.join(', ')}.`);
  }
  if (session.painPoints.length > 0) {
    parts.push(`Pain points: ${session.painPoints.join('; ')}.`);
  }
  if (session.advocacyStance) {
    parts.push(`Advocacy stance: ${session.advocacyStance}.`);
  }

  return parts.join(' ');
}

export const DISSATISFACTION_REASONS = [
  'Network reliability',
  'Billing accuracy',
  'Support responsiveness',
  'Product fit',
  'Pricing',
  'Account management',
  'Other',
];

export const PRODUCT_CATALOG = [
  'Jio Cloud',
  'Jio Private 5G',
  'Enterprise Fiber',
  'Jio Secure Access',
  'Jio IoT Connect',
  'Jio M2M',
  'Jio Secure Edge',
  'Jio SD-WAN',
  'Jio Cyber Shield',
  'Jio Secure SD-WAN',
  'Jio Voice',
  'Managed Services',
  '5G Roaming',
  'Shared Fiber',
  'Jio Tower Infra',
  'Professional Services',
];
