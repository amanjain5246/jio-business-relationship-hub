// Core data models for the Jio Business Relationship Hub

export type AccountHealth = 'red' | 'amber' | 'green';

export type ID = string;

export interface Account {
  id: ID;
  name: string;
  industry: string;
  segment: 'Enterprise' | 'Mid-Market' | 'SMB' | 'Strategic';
  health: AccountHealth;
  arr: number; // annual recurring revenue in INR lakhs
  relationshipManager: string;
  contractStart: string; // ISO date
  contractRenewal: string; // ISO date
  contactsCount: number;
  openIssues: number;
  openOpportunities: number;
  lastInteraction: string; // ISO date
  logoColor: string; // tailwind gradient seed
  website: string;
  hqCity: string;
}

export interface Contact {
  id: ID;
  accountId: ID;
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  influence: 'Decision Maker' | 'Influencer' | 'Champion' | 'User';
}

export interface Customer360HistoryEntry {
  id: ID;
  field: string;
  oldValue: string;
  newValue: string;
  changedAt: string; // ISO datetime
  changedBy: string;
  source: string;
}

export type VerificationStatus = 'Verified' | 'Unverified' | 'Pending Verification';

export interface FieldMetadata {
  source: string;
  lastUpdatedAt: string; // ISO datetime
  verificationStatus: VerificationStatus;
}

export interface Customer360 {
  accountId: ID;
  overview: string;
  objectives: string[];
  productsUsed: string[];
  satisfactionScore: number; // 0-100
  npsScore: number; // -100 to 100
  engagementTrend: 'up' | 'stable' | 'down';
  lastQbrDate: string; // ISO date
  nextQbrDate: string; // ISO date
  revenueHistory: { quarter: string; value: number }[];
  keyRisks: string[];
  strategicInitiatives: string[];
  history: Customer360HistoryEntry[];
  // Trust-sensitive master data — not directly editable; changed only via an approved Update Request.
  legalName: string;
  gst: string;
  pan: string;
  fieldMeta: {
    legalName: FieldMetadata;
    gst: FieldMetadata;
    pan: FieldMetadata;
  };
}

export type InteractionChannel =
  | 'Call'
  | 'Email'
  | 'Meeting'
  | 'Site Visit'
  | 'Digital'
  | 'Conference';

export type InteractionDirection = 'Inbound' | 'Outbound';

export interface Interaction {
  id: ID;
  accountId: ID;
  contactId: ID | null;
  channel: InteractionChannel;
  direction: InteractionDirection;
  subject: string;
  summary: string;
  date: string; // ISO datetime
  durationMins: number;
  owner: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export type IssueStatus = 'Open' | 'In Progress' | 'Escalated' | 'Resolved' | 'Closed';
export type IssuePriority = 'P1' | 'P2' | 'P3' | 'P4';
export type IssueCategory =
  | 'Network'
  | 'Billing'
  | 'Service'
  | 'Technical'
  | 'Contract'
  | 'Product';

export interface Issue {
  id: ID;
  accountId: ID;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  category: IssueCategory;
  assignedTo: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  resolvedAt: string | null;
  dueDate: string; // ISO date
  healthImpact: AccountHealth;
}

export type OpportunityStage =
  | 'Discovery'
  | 'Qualification'
  | 'Proposal'
  | 'Negotiation'
  | 'Closed Won'
  | 'Closed Lost';

export interface Opportunity {
  id: ID;
  accountId: ID;
  name: string;
  stage: OpportunityStage;
  value: number; // in INR lakhs
  probability: number; // 0-100
  expectedClose: string; // ISO date
  owner: string;
  products: string[];
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  nextStep: string;
}

export type NotificationType =
  | 'Issue'
  | 'Opportunity'
  | 'Renewal'
  | 'Interaction'
  | 'Update Request'
  | 'Accountability'
  | 'System';

export interface NotificationItem {
  id: ID;
  type: NotificationType;
  title: string;
  message: string;
  accountId: ID | null;
  createdAt: string; // ISO datetime
  read: boolean;
  priority: 'high' | 'medium' | 'low';
}

export type UpdateRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Action Required';

export type UpdateRequestAttachmentKind = 'Image' | 'PDF';

export interface UpdateRequestAttachment {
  name: string;
  kind: UpdateRequestAttachmentKind;
  sizeKb: number;
}

export interface UpdateRequestAuditEntry {
  id: ID;
  actor: string;
  action: string;
  detail: string;
  timestamp: string; // ISO datetime
}

export interface UpdateRequest {
  id: ID;
  accountId: ID;
  field: string;
  currentValue: string;
  requestedValue: string;
  reason: string;
  requestedBy: string;
  requestedAt: string; // ISO date
  status: UpdateRequestStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  attachment: UpdateRequestAttachment | null;
  clarificationNote: string | null;
  customerNotifiedAt: string | null;
  urmNotifiedAt: string | null;
  auditTrail: UpdateRequestAuditEntry[];
}

export type AccountabilityEventType =
  | 'RM Change'
  | 'Escalation'
  | 'Executive Sponsor'
  | 'QBR Held'
  | 'Contract Signed'
  | 'Health Review'
  | 'Site Visit'
  | 'Interaction Logged';

export interface AccountabilityEvent {
  id: ID;
  accountId: ID;
  type: AccountabilityEventType;
  title: string;
  description: string;
  actor: string;
  date: string; // ISO date
  impact: 'High' | 'Medium' | 'Low';
}

export type CalendarType =
  | 'QBR'
  | 'Renewal'
  | 'Review'
  | 'Follow-up'
  | 'Executive Meeting'
  | 'Training';

export type MeetingMode = 'In-Person' | 'Virtual' | 'Phone' | 'Hybrid';

export type SchedulingAction = 'Scheduled' | 'Rescheduled' | 'Cancelled' | 'Completed';

export interface SchedulingHistoryEntry {
  id: ID;
  calendarId: ID;
  action: SchedulingAction;
  oldDate?: string;
  oldTime?: string;
  newDate?: string;
  newTime?: string;
  reason?: string;
  actor: string;
  timestamp: string; // ISO datetime
}

export interface CalendarRecord {
  id: ID;
  accountId: ID;
  contactId: ID | null;
  title: string;
  type: CalendarType;
  date: string; // ISO date
  time: string; // HH:mm
  durationMins: number;
  mode: MeetingMode;
  location: string;
  purpose: string;
  notes: string;
  attendees: string[];
  owner: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  createdAt: string; // ISO datetime
}

export interface MomSummary {
  id: ID;
  accountId: ID;
  title: string;
  meetingDate: string; // ISO date
  attendees: string[];
  agenda: string[];
  decisions: string[];
  actionItems: {
    id: ID;
    task: string;
    owner: string;
    dueDate: string;
    done: boolean;
  }[];
  createdBy: string;
  createdAt: string; // ISO date
  // Sanitized recap safe to share with the customer — never includes internal
  // risk, health, competitor, or accountability information.
  customerFacingSummary: string;
}

export type DiscoveryInteractionType = 'First Interaction' | 'Repeat Interaction';

export type CustomerExperienceRating =
  | 'Very Satisfied'
  | 'Satisfied'
  | 'Neutral'
  | 'Dissatisfied'
  | 'Very Dissatisfied';

export type AdvocacyStance = 'Promoter' | 'Passive' | 'Detractor';

export type ExpansionPotential = 'High' | 'Medium' | 'Low' | 'None';

export interface DiscoveryStakeholder {
  id: ID;
  contactId: ID | null;
  name: string;
  role: string;
  isNewStakeholder: boolean;
}

export interface DiscoverySession {
  id: ID;
  accountId: ID;
  contactId: ID | null;
  conductedBy: string;
  date: string; // ISO datetime

  interactionType: DiscoveryInteractionType;
  whatChangedSinceLast: string;

  experienceRating: CustomerExperienceRating | null;
  isDissatisfied: boolean;
  dissatisfactionReasons: string[];
  dissatisfactionDetails: string;

  awareOfCustomerCare: boolean | null;
  customerCareFeedback: string;

  businessGrowthPlans: string;
  expansionPotential: ExpansionPotential | null;

  productNeedIdentified: boolean | null;
  productOpportunityNotes: string;
  interestedProducts: string[];

  usingCompetitor: boolean | null;
  competitorNames: string[];
  competitorNotes: string;

  advocacyStance: AdvocacyStance | null;
  willingToBeReference: boolean | null;

  painPoints: string[];

  stakeholders: DiscoveryStakeholder[];

  contractAware: boolean | null;
  contractConcerns: string;

  keyFindings: string;

  linkedIssueIds: ID[];
  linkedOpportunityIds: ID[];
  customer360FieldsUpdated: string[];

  createdAt: string; // ISO datetime
}

export interface AppData {
  accounts: Account[];
  contacts: Contact[];
  customer360: Customer360[];
  interactions: Interaction[];
  issues: Issue[];
  opportunities: Opportunity[];
  notifications: NotificationItem[];
  updateRequests: UpdateRequest[];
  accountabilityEvents: AccountabilityEvent[];
  calendar: CalendarRecord[];
  momSummaries: MomSummary[];
  schedulingHistory: SchedulingHistoryEntry[];
  discoverySessions: DiscoverySession[];
}
