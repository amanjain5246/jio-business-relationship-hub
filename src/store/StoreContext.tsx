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
  AccountabilityEvent,
  CalendarRecord,
  MomSummary,
  SchedulingHistoryEntry,
} from '@/types/models';
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
  updateCustomer360: (accountId: string, updates: Partial<Customer360>) => void;
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
  // Reset
  resetData: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (parsed.accounts && parsed.accounts.length > 0) return parsed;
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

  const updateCustomer360 = useCallback((accountId: string, updates: Partial<Customer360>) => {
    setData((prev) => ({
      ...prev,
      customer360: prev.customer360.map((c) => (c.accountId === accountId ? { ...c, ...updates } : c)),
    }));
  }, []);

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
    addAccountabilityEvent,
    addCalendarRecord,
    updateCalendarRecord,
    deleteCalendarRecord,
    addSchedulingHistory,
    addMomSummary,
    updateMomSummary,
    resetData,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
