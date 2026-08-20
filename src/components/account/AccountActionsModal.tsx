import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { genId, formatDate } from '@/utils/format';
import { findSchedulingConflicts } from '@/utils/schedulingEngine';
import { PRODUCT_CATALOG } from '@/utils/discoveryEngine';
import type {
  Account,
  Contact,
  Customer360,
  Issue,
  IssuePriority,
  Opportunity,
  CalendarRecord,
  CalendarType,
  MeetingMode,
} from '@/types/models';
import { HelpCircle, TrendingUp, CalendarPlus, Ban, ArrowLeft, AlertTriangle, Send } from 'lucide-react';

interface AccountActionsModalProps {
  account: Account;
  contacts: Contact[];
  c360: Customer360 | null;
  onClose: () => void;
}

type ActionId = 'query' | 'new-service' | 'schedule-meeting' | 'end-service';

const ACTIONS: { id: ActionId; label: string; description: string; icon: typeof HelpCircle }[] = [
  { id: 'query', label: 'Raise a Query', description: 'Log a question or support request for this account.', icon: HelpCircle },
  { id: 'new-service', label: 'Request New Service', description: 'Flag interest in an additional product or service.', icon: TrendingUp },
  { id: 'schedule-meeting', label: 'Schedule a Meeting', description: 'Book a follow-up with a conflict check.', icon: CalendarPlus },
  { id: 'end-service', label: 'Request to End a Service', description: 'Start a cancellation review for an existing service.', icon: Ban },
];

const CAL_TYPES: CalendarType[] = ['QBR', 'Renewal', 'Review', 'Follow-up', 'Executive Meeting', 'Training'];
const MEETING_MODES: MeetingMode[] = ['In-Person', 'Virtual', 'Phone', 'Hybrid'];
const PRIORITIES: IssuePriority[] = ['P1', 'P2', 'P3', 'P4'];

export function AccountActionsModal({ account, contacts, c360, onClose }: AccountActionsModalProps) {
  const { data, addIssue, addOpportunity, addCalendarRecord, addSchedulingHistory, addNotification, addAccountabilityEvent } = useStore();
  const toast = useToast();
  const [action, setAction] = useState<ActionId | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Query
  const [queryTitle, setQueryTitle] = useState('');
  const [queryDetails, setQueryDetails] = useState('');
  const [queryPriority, setQueryPriority] = useState<IssuePriority>('P3');

  // New service
  const [serviceProduct, setServiceProduct] = useState('');
  const [serviceDetails, setServiceDetails] = useState('');
  const [serviceValue, setServiceValue] = useState('');

  // Schedule meeting
  const [meetingContactId, setMeetingContactId] = useState<string | null>(contacts.find((c) => c.isPrimary)?.id || contacts[0]?.id || null);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('10:00');
  const [meetingDuration, setMeetingDuration] = useState(30);
  const [meetingType, setMeetingType] = useState<CalendarType>('Follow-up');
  const [meetingMode, setMeetingMode] = useState<MeetingMode>('Virtual');
  const [meetingPurpose, setMeetingPurpose] = useState('');

  // End service
  const [endProduct, setEndProduct] = useState('');
  const [endReason, setEndReason] = useState('');

  const activeProducts = c360?.productsUsed || [];
  const meetingConflicts =
    meetingDate && meetingTime
      ? findSchedulingConflicts(data, { accountId: account.id, owner: account.relationshipManager, date: meetingDate, time: meetingTime, durationMins: meetingDuration })
      : [];

  const reset = () => {
    setAction(null);
    setQueryTitle('');
    setQueryDetails('');
    setQueryPriority('P3');
    setServiceProduct('');
    setServiceDetails('');
    setServiceValue('');
    setMeetingDate('');
    setMeetingTime('10:00');
    setMeetingDuration(30);
    setMeetingType('Follow-up');
    setMeetingMode('Virtual');
    setMeetingPurpose('');
    setEndProduct('');
    setEndReason('');
  };

  const requestClose = () => {
    onClose();
    reset();
  };

  const submitQuery = () => {
    if (!queryTitle.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date().toISOString();
      const issue: Issue = {
        id: genId('iss'),
        accountId: account.id,
        title: queryTitle.trim(),
        description: queryDetails.trim() || 'Raised via Account Actions.',
        status: 'Open',
        priority: queryPriority,
        category: 'Service',
        assignedTo: account.relationshipManager,
        createdAt: today,
        updatedAt: today,
        resolvedAt: null,
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        healthImpact: queryPriority === 'P1' ? 'red' : queryPriority === 'P2' ? 'amber' : account.health,
      };
      addIssue(issue);
      addNotification({
        id: genId('not'),
        type: 'Issue',
        title: `Query raised: ${account.name}`,
        message: queryTitle.trim(),
        accountId: account.id,
        createdAt: now,
        read: false,
        priority: queryPriority === 'P1' ? 'high' : 'medium',
      });
      toast.success('Query raised.');
      setSubmitting(false);
      requestClose();
    }, 350);
  };

  const submitNewService = () => {
    if (!serviceProduct.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date().toISOString();
      const expectedClose = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
      const opp: Opportunity = {
        id: genId('opp'),
        accountId: account.id,
        name: `New Service Request — ${serviceProduct.trim()}`,
        stage: 'Discovery',
        value: Number(serviceValue) || 0,
        probability: 20,
        expectedClose,
        owner: account.relationshipManager,
        products: [serviceProduct.trim()],
        createdAt: today,
        updatedAt: today,
        nextStep: serviceDetails.trim() || 'Qualify the request and scope the service.',
      };
      addOpportunity(opp);
      addNotification({
        id: genId('not'),
        type: 'Opportunity',
        title: `New service requested: ${account.name}`,
        message: `${serviceProduct.trim()} — ${serviceDetails.trim() || 'no additional details'}`,
        accountId: account.id,
        createdAt: now,
        read: false,
        priority: 'medium',
      });
      toast.success('Service request submitted as a new opportunity.');
      setSubmitting(false);
      requestClose();
    }, 350);
  };

  const submitMeeting = () => {
    if (!meetingDate || !meetingTime) return;
    setSubmitting(true);
    setTimeout(() => {
      const now = new Date().toISOString();
      const contact = contacts.find((c) => c.id === meetingContactId) || null;
      const calId = genId('cal');
      const cal: CalendarRecord = {
        id: calId,
        accountId: account.id,
        contactId: meetingContactId,
        title: meetingPurpose || `Meeting with ${account.name}`,
        type: meetingType,
        date: meetingDate,
        time: meetingTime,
        durationMins: meetingDuration,
        mode: meetingMode,
        location: meetingMode === 'In-Person' ? account.hqCity : 'Virtual',
        purpose: meetingPurpose,
        notes: 'Scheduled from Account Actions.',
        attendees: [account.relationshipManager, contact?.name || ''].filter(Boolean),
        owner: account.relationshipManager,
        status: 'Scheduled',
        createdAt: now,
      };
      addCalendarRecord(cal);
      addSchedulingHistory({
        id: genId('sch'),
        calendarId: calId,
        action: 'Scheduled',
        newDate: meetingDate,
        newTime: meetingTime,
        actor: account.relationshipManager,
        timestamp: now,
      });
      addNotification({
        id: genId('not'),
        type: 'System',
        title: `Meeting scheduled: ${account.name}`,
        message: `${cal.title} on ${formatDate(meetingDate)} at ${meetingTime}.`,
        accountId: account.id,
        createdAt: now,
        read: false,
        priority: 'low',
      });
      toast.success(`Meeting scheduled for ${formatDate(meetingDate)} at ${meetingTime}.`);
      setSubmitting(false);
      requestClose();
    }, 350);
  };

  const submitEndService = () => {
    if (!endProduct.trim() || !endReason.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date().toISOString();
      const issue: Issue = {
        id: genId('iss'),
        accountId: account.id,
        title: `Request to end service — ${endProduct.trim()}`,
        description: endReason.trim(),
        status: 'Open',
        priority: 'P2',
        category: 'Contract',
        assignedTo: account.relationshipManager,
        createdAt: today,
        updatedAt: today,
        resolvedAt: null,
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        healthImpact: 'amber',
      };
      addIssue(issue);
      addAccountabilityEvent({
        id: genId('acc-evt'),
        accountId: account.id,
        type: 'Escalation',
        title: `Service cancellation requested — ${endProduct.trim()}`,
        description: endReason.trim(),
        actor: account.relationshipManager,
        date: today,
        impact: 'High',
      });
      addNotification({
        id: genId('not'),
        type: 'Issue',
        title: `Service cancellation requested: ${account.name}`,
        message: `${endProduct.trim()} — ${endReason.trim()}`,
        accountId: account.id,
        createdAt: now,
        read: false,
        priority: 'high',
      });
      toast.warning('Cancellation request logged for review.');
      setSubmitting(false);
      requestClose();
    }, 350);
  };

  const canSubmit =
    action === 'query' ? queryTitle.trim().length > 0 :
    action === 'new-service' ? serviceProduct.trim().length > 0 :
    action === 'schedule-meeting' ? !!meetingDate && !!meetingTime :
    action === 'end-service' ? endProduct.trim().length > 0 && endReason.trim().length > 0 :
    false;

  const handleSubmit = () => {
    if (action === 'query') submitQuery();
    else if (action === 'new-service') submitNewService();
    else if (action === 'schedule-meeting') submitMeeting();
    else if (action === 'end-service') submitEndService();
  };

  const activeAction = ACTIONS.find((a) => a.id === action);

  return (
    <Modal
      open
      onClose={requestClose}
      title={activeAction ? activeAction.label : `${account.name} — Account Actions`}
      footer={
        action ? (
          <>
            <Button onClick={() => setAction(null)} disabled={submitting}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button variant={action === 'end-service' ? 'danger' : 'primary'} onClick={handleSubmit} disabled={!canSubmit} loading={submitting}>
              <Send className="h-4 w-4" /> Submit
            </Button>
          </>
        ) : (
          <Button onClick={requestClose}>Close</Button>
        )
      }
    >
      {!action ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={() => setAction(a.id)}
                className="flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-ink-200 hover:border-brand-400 hover:bg-brand-50/40 transition text-left"
              >
                <div className="h-9 w-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <p className="text-sm font-semibold text-ink-900">{a.label}</p>
                <p className="text-xs text-ink-500 leading-relaxed">{a.description}</p>
              </button>
            );
          })}
        </div>
      ) : action === 'query' ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink-700 mb-1.5 block">Subject</label>
            <input type="text" value={queryTitle} onChange={(e) => setQueryTitle(e.target.value)} placeholder="What is the query about?" className="input" />
          </div>
          <div>
            <label className="text-sm font-medium text-ink-700 mb-1.5 block">Details</label>
            <textarea value={queryDetails} onChange={(e) => setQueryDetails(e.target.value)} placeholder="Add any relevant context..." rows={3} className="input resize-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-ink-700 mb-1.5 block">Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setQueryPriority(p)}
                  className={`py-2 rounded-lg border-2 text-sm font-medium transition ${queryPriority === p ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-500'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : action === 'new-service' ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink-700 mb-1.5 block">Product / Service</label>
            <input
              type="text"
              list="product-catalog"
              value={serviceProduct}
              onChange={(e) => setServiceProduct(e.target.value)}
              placeholder="Select or type a product"
              className="input"
            />
            <datalist id="product-catalog">
              {PRODUCT_CATALOG.map((p) => <option key={p} value={p} />)}
            </datalist>
          </div>
          <div>
            <label className="text-sm font-medium text-ink-700 mb-1.5 block">Details</label>
            <textarea value={serviceDetails} onChange={(e) => setServiceDetails(e.target.value)} placeholder="What does the customer need, and why?" rows={3} className="input resize-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-ink-700 mb-1.5 block">Estimated Value (₹ Lakhs, optional)</label>
            <input type="number" value={serviceValue} onChange={(e) => setServiceValue(e.target.value)} placeholder="0" className="input" />
          </div>
          <p className="text-xs text-ink-400">This creates a new Opportunity in the Discovery stage.</p>
        </div>
      ) : action === 'schedule-meeting' ? (
        <div className="space-y-4">
          {contacts.length > 0 && (
            <div>
              <label className="text-sm font-medium text-ink-700 mb-1.5 block">Contact</label>
              <select value={meetingContactId || ''} onChange={(e) => setMeetingContactId(e.target.value || null)} className="input">
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.role}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-700 mb-1.5 block">Date</label>
              <input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700 mb-1.5 block">Time</label>
              <input type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink-700 mb-1.5 block">Duration</label>
              <select value={meetingDuration} onChange={(e) => setMeetingDuration(Number(e.target.value))} className="input">
                {[15, 30, 45, 60, 90, 120].map((d) => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700 mb-1.5 block">Type</label>
              <select value={meetingType} onChange={(e) => setMeetingType(e.target.value as CalendarType)} className="input">
                {CAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-ink-700 mb-1.5 block">Mode</label>
            <div className="grid grid-cols-4 gap-2">
              {MEETING_MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMeetingMode(m)}
                  className={`py-2 rounded-lg border-2 text-xs font-medium transition ${meetingMode === m ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-500'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-ink-700 mb-1.5 block">Purpose</label>
            <input type="text" value={meetingPurpose} onChange={(e) => setMeetingPurpose(e.target.value)} placeholder="What is this meeting about?" className="input" />
          </div>
          {meetingConflicts.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-1.5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-800">Overlaps {meetingConflicts.length} other meeting{meetingConflicts.length > 1 ? 's' : ''}:</p>
              </div>
              <ul className="pl-6 space-y-0.5">
                {meetingConflicts.map((c) => (
                  <li key={c.id} className="text-xs text-red-700">{c.title} · {c.time} ({c.durationMins}m) · {c.owner}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink-700 mb-1.5 block">Product / Service to end</label>
            {activeProducts.length > 0 ? (
              <select value={endProduct} onChange={(e) => setEndProduct(e.target.value)} className="input">
                <option value="">Select a product in use</option>
                {activeProducts.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            ) : (
              <input type="text" value={endProduct} onChange={(e) => setEndProduct(e.target.value)} placeholder="Which product or service?" className="input" />
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-ink-700 mb-1.5 block">Reason (required)</label>
            <textarea value={endReason} onChange={(e) => setEndReason(e.target.value)} placeholder="Why is the customer requesting this?" rows={3} className="input resize-none" />
          </div>
          <p className="text-xs text-ink-400">This opens a Contract issue for the account team to review, and logs an accountability event — it does not remove the service immediately.</p>
        </div>
      )}
    </Modal>
  );
}
