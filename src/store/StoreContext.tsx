import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type {
  AppData,
  Account,
  Contact,
  Customer360,
  Interaction,
  Issue,
  Opportunity,
  NotificationItem,
  UpdateRequest,
  UpdateRequestAuditEntry,
  AccountabilityEvent,
  CalendarRecord,
  MomSummary,
  SchedulingHistoryEntry,
  DiscoverySession,
} from '@/types/models';
import { genId } from '@/utils/format';
import { applyCustomer360Updates } from '@/utils/customer360';
import { applyApprovedValue } from '@/utils/updateRequestEngine';
import { SEED_DATA } from '@/data/seedData';

const STORAGE_KEY = 'jio-brh-data-v1';

type ViewMode = 'desktop' | 'mobile';

interface StoreContextValue {
  data: AppData;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  // Accounts
  updateAccount: (id: string, updates: Partial<Account>) => void;
  addAccount: (account: Account) => void;
  // Contacts
  addContact: (contact: Contact) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  // Customer360
  updateCustomer360: (accountId: string, updates: Partial<Customer360>, changedBy?: string, source?: string) => void;
  // Interactions
  addInteraction: (interaction: Interaction) => void;
  updateInteraction: (id: string, updates: Partial<Interaction>) => void;
  // Issues
  addIssue: (issue: Issue) => void;
  updateIssue: (id: string, updates: Partial<Issue>) => void;
  // Opportunities
  addOpportunity: (opp: Opportunity) => void;
  updateOpportunity: (id: string, updates: Partial<Opportunity>) => void;
  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (notif: NotificationItem) => void;
  // Update Requests
  addUpdateRequest: (req: UpdateRequest) => void;
  updateUpdateRequest: (id: string, updates: Partial<UpdateRequest>) => void;
  decideUpdateRequest: (
    id: string,
    decision: 'Approved' | 'Rejected' | 'Action Required',
    reviewedBy: string,
    note?: string,
  ) => void;
  // Accountability Events
  addAccountabilityEvent: (evt: AccountabilityEvent) => void;
  // Calendar
  addCalendarRecord: (cal: CalendarRecord) => void;
  updateCalendarRecord: (id: string, updates: Partial<CalendarRecord>) => void;
  deleteCalendarRecord: (id: string) => void;
  // Scheduling History
  addSchedulingHistory: (entry: SchedulingHistoryEntry) => void;
  // MOM Summaries
  addMomSummary: (mom: MomSummary) => void;
  updateMomSummary: (id: string, updates: Partial<MomSummary>) => void;
  // Discovery Sessions
  addDiscoverySession: (session: DiscoverySession) => void;
  updateDiscoverySession: (id: string, updates: Partial<DiscoverySession>) => void;
  // Reset
  resetData: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const UNVERIFIED_META = { source: 'Legacy Data', lastUpdatedAt: '', verificationStatus: 'Unverified' as const };

function migrate(parsed: AppData): AppData {
  return {
    ...parsed,
    discoverySessions: parsed.discoverySessions || [],
    customer360: parsed.customer360.map((c) => ({
      ...c,
      history: c.history || [],
      legalName: c.legalName ?? '',
      gst: c.gst ?? '',
      pan: c.pan ?? '',
      fieldMeta: c.fieldMeta || { legalName: UNVERIFIED_META, gst: UNVERIFIED_META, pan: UNVERIFIED_META },
    })),
    updateRequests: parsed.updateRequests.map((r) => ({
      ...r,
      attachment: r.attachment ?? null,
      clarificationNote: r.clarificationNote ?? null,
      customerNotifiedAt: r.customerNotifiedAt ?? null,
      urmNotifiedAt: r.urmNotifiedAt ?? null,
      auditTrail: r.auditTrail || [],
    })),
    momSummaries: parsed.momSummaries.map((m) => ({ ...m, customerFacingSummary: m.customerFacingSummary ?? '' })),
  };
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (parsed.accounts && parsed.accounts.length > 0) return migrate(parsed);
    }
  } catch {
    // fall through to seed
  }
  return structuredClone(SEED_DATA);
}

function saveData(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem('jio-brh-viewmode') as ViewMode) || 'desktop';
    } catch {
      return 'desktop';
    }
  });

  useEffect(() => {
    saveData(data);
  }, [data]);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem('jio-brh-viewmode', mode);
    } catch {
      // ignore
    }
  }, []);

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    setData((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  }, []);

  const addAccount = useCallback((account: Account) => {
    setData((prev) => ({ ...prev, accounts: [account, ...prev.accounts] }));
  }, []);

  const addContact = useCallback((contact: Contact) => {
    setData((prev) => ({ ...prev, contacts: [contact, ...prev.contacts] }));
  }, []);

  const updateContact = useCallback((id: string, updates: Partial<Contact>) => {
    setData((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  }, []);

  const updateCustomer360 = useCallback(
    (accountId: string, updates: Partial<Customer360>, changedBy = 'System', source = 'Manual Edit') => {
      setData((prev) => ({
        ...prev,
        customer360: prev.customer360.map((c) =>
          c.accountId === accountId ? applyCustomer360Updates(c, updates, changedBy, source) : c,
        ),
      }));
    },
    [],
  );

  const addInteraction = useCallback((interaction: Interaction) => {
    setData((prev) => ({ ...prev, interactions: [interaction, ...prev.interactions] }));
  }, []);

  const updateInteraction = useCallback((id: string, updates: Partial<Interaction>) => {
    setData((prev) => ({
      ...prev,
      interactions: prev.interactions.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }));
  }, []);

  const addIssue = useCallback((issue: Issue) => {
    setData((prev) => ({ ...prev, issues: [issue, ...prev.issues] }));
  }, []);

  const updateIssue = useCallback((id: string, updates: Partial<Issue>) => {
    setData((prev) => ({
      ...prev,
      issues: prev.issues.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }));
  }, []);

  const addOpportunity = useCallback((opp: Opportunity) => {
    setData((prev) => ({ ...prev, opportunities: [opp, ...prev.opportunities] }));
  }, []);

  const updateOpportunity = useCallback((id: string, updates: Partial<Opportunity>) => {
    setData((prev) => ({
      ...prev,
      opportunities: prev.opportunities.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    }));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, []);

  const addNotification = useCallback((notif: NotificationItem) => {
    setData((prev) => ({ ...prev, notifications: [notif, ...prev.notifications] }));
  }, []);

  const addUpdateRequest = useCallback((req: UpdateRequest) => {
    setData((prev) => ({ ...prev, updateRequests: [req, ...prev.updateRequests] }));
  }, []);

  const updateUpdateRequest = useCallback((id: string, updates: Partial<UpdateRequest>) => {
    setData((prev) => ({
      ...prev,
      updateRequests: prev.updateRequests.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  }, []);

  const decideUpdateRequest = useCallback(
    (id: string, decision: 'Approved' | 'Rejected' | 'Action Required', reviewedBy: string, note?: string) => {
      setData((prev) => {
        const req = prev.updateRequests.find((r) => r.id === id);
        if (!req) return prev;

        const now = new Date().toISOString();
        const today = now.slice(0, 10);
        const account = prev.accounts.find((a) => a.id === req.accountId);
        const accountName = account?.name || 'the account';

        const decisionDetail =
          decision === 'Action Required'
            ? note || 'Clarification requested from requester.'
            : note || `${req.field} update ${decision.toLowerCase()} by ${reviewedBy}.`;

        const newAuditEntries: UpdateRequestAuditEntry[] = [
          { id: genId('aud'), actor: reviewedBy, action: decision, detail: decisionDetail, timestamp: now },
          {
            id: genId('aud'),
            actor: 'System',
            action: 'Customer Notified',
            detail: `Customer notified (simulated) that their ${req.field} update request was ${decision.toLowerCase()}.`,
            timestamp: now,
          },
          {
            id: genId('aud'),
            actor: 'System',
            action: 'URM Notified',
            detail: `URM notified (simulated) of the ${decision.toLowerCase()} decision on ${req.field}.`,
            timestamp: now,
          },
        ];

        let next: AppData = {
          ...prev,
          updateRequests: prev.updateRequests.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: decision,
                  reviewedBy,
                  reviewedAt: today,
                  clarificationNote: decision === 'Action Required' ? decisionDetail : r.clarificationNote,
                  customerNotifiedAt: now,
                  urmNotifiedAt: now,
                  auditTrail: [...r.auditTrail, ...newAuditEntries],
                }
              : r,
          ),
        };

        if (decision === 'Approved') {
          next = applyApprovedValue(next, req, reviewedBy);

          const accountabilityType = req.field === 'Relationship Manager' ? 'RM Change' : req.field === 'Health' ? 'Health Review' : null;
          if (accountabilityType) {
            next = {
              ...next,
              accountabilityEvents: [
                {
                  id: genId('acc-evt'),
                  accountId: req.accountId,
                  type: accountabilityType,
                  title: `${req.field} updated via approved request`,
                  description: `${req.currentValue} → ${req.requestedValue}. ${req.reason}`,
                  actor: reviewedBy,
                  date: today,
                  impact: req.field === 'Relationship Manager' ? 'High' : 'Medium',
                },
                ...next.accountabilityEvents,
              ],
            };
          }
        }

        const notifPriority = decision === 'Rejected' ? 'high' : decision === 'Action Required' ? 'medium' : 'low';
        next = {
          ...next,
          notifications: [
            {
              id: genId('not'),
              type: 'Update Request',
              title: `${req.field} update ${decision.toLowerCase()} — ${accountName}`,
              message: `URM notified: ${decisionDetail}`,
              accountId: req.accountId,
              createdAt: now,
              read: false,
              priority: notifPriority,
            },
            {
              id: genId('not'),
              type: 'Update Request',
              title: `Customer notified — ${req.field} update ${decision.toLowerCase()}`,
              message: `Customer notified (simulated) for ${accountName}: ${decisionDetail}`,
              accountId: req.accountId,
              createdAt: now,
              read: false,
              priority: notifPriority,
            },
            ...next.notifications,
          ],
        };

        return next;
      });
    },
    [],
  );

  const addAccountabilityEvent = useCallback((evt: AccountabilityEvent) => {
    setData((prev) => ({ ...prev, accountabilityEvents: [evt, ...prev.accountabilityEvents] }));
  }, []);

  const addCalendarRecord = useCallback((cal: CalendarRecord) => {
    setData((prev) => ({ ...prev, calendar: [cal, ...prev.calendar] }));
  }, []);

  const updateCalendarRecord = useCallback((id: string, updates: Partial<CalendarRecord>) => {
    setData((prev) => ({
      ...prev,
      calendar: prev.calendar.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  }, []);

  const deleteCalendarRecord = useCallback((id: string) => {
    setData((prev) => ({ ...prev, calendar: prev.calendar.filter((c) => c.id !== id) }));
  }, []);

  const addSchedulingHistory = useCallback((entry: SchedulingHistoryEntry) => {
    setData((prev) => ({ ...prev, schedulingHistory: [entry, ...prev.schedulingHistory] }));
  }, []);

  const addMomSummary = useCallback((mom: MomSummary) => {
    setData((prev) => ({ ...prev, momSummaries: [mom, ...prev.momSummaries] }));
  }, []);

  const updateMomSummary = useCallback((id: string, updates: Partial<MomSummary>) => {
    setData((prev) => ({
      ...prev,
      momSummaries: prev.momSummaries.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  }, []);

  const addDiscoverySession = useCallback((session: DiscoverySession) => {
    setData((prev) => ({ ...prev, discoverySessions: [session, ...prev.discoverySessions] }));
  }, []);

  const updateDiscoverySession = useCallback((id: string, updates: Partial<DiscoverySession>) => {
    setData((prev) => ({
      ...prev,
      discoverySessions: prev.discoverySessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  }, []);

  const resetData = useCallback(() => {
    const fresh = structuredClone(SEED_DATA);
    setData(fresh);
  }, []);

  const value: StoreContextValue = {
    data,
    viewMode,
    setViewMode,
    updateAccount,
    addAccount,
    addContact,
    updateContact,
    updateCustomer360,
    addInteraction,
    updateInteraction,
    addIssue,
    updateIssue,
    addOpportunity,
    updateOpportunity,
    markNotificationRead,
    markAllNotificationsRead,
    addNotification,
    addUpdateRequest,
    updateUpdateRequest,
    decideUpdateRequest,
    addAccountabilityEvent,
    addCalendarRecord,
    updateCalendarRecord,
    deleteCalendarRecord,
    addSchedulingHistory,
    addMomSummary,
    updateMomSummary,
    addDiscoverySession,
    updateDiscoverySession,
    resetData,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
