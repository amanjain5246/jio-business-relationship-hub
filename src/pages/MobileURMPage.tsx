import { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '@/store/StoreContext';
import { Badge } from '@/components/ui/Badge';
import { AccountAvatar, Avatar } from '@/components/ui/Avatar';
import { HealthBadge } from '@/components/ui/HealthBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatINR, formatDate, genId } from '@/utils/format';
import {
  sentimentCustomer360Updates,
  recommendFollowUpWindow,
  isSignificantlyLate,
  findMatchingOpenIssue,
  findMatchingOpenOpportunity,
  buildCustomerFacingSummary,
  type FollowUpRecommendation,
} from '@/utils/interactionCompletionEngine';
import { findSchedulingConflicts } from '@/utils/schedulingEngine';
import { useToast } from '@/components/ui/ToastProvider';
import type {
  Account,
  Contact,
  InteractionChannel,
  Issue,
  IssuePriority,
  IssueCategory,
  Opportunity,
  OpportunityStage,
  CalendarRecord,
  CalendarType,
  MeetingMode,
  MomSummary,
  Interaction,
} from '@/types/models';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  MapPin,
  Phone,
  PhoneCall,
  PhoneOff,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Video,
  VideoOff,
  X,
  Zap,
  AlertTriangle,
  Building2,
  User,
  ClipboardList,
} from 'lucide-react';

interface MobileURMPageProps {
  onNavigate: (path: string) => void;
}

type Step =
  | 'today'
  | 'account'
  | 'mode'
  | 'simulate'
  | 'discovery'
  | 'customer360'
  | 'issue'
  | 'opportunity'
  | 'commitments'
  | 'review'
  | 'mom'
  | 'schedule'
  | 'done';

const STEPS: { id: Step; label: string }[] = [
  { id: 'today', label: "Today's Plan" },
  { id: 'account', label: 'Account' },
  { id: 'mode', label: 'Mode' },
  { id: 'simulate', label: 'Interaction' },
  { id: 'discovery', label: 'Discovery' },
  { id: 'customer360', label: 'Customer 360' },
  { id: 'issue', label: 'Issues' },
  { id: 'opportunity', label: 'Opportunities' },
  { id: 'commitments', label: 'Commitments' },
  { id: 'review', label: 'Review' },
  { id: 'mom', label: 'MOM' },
  { id: 'schedule', label: 'Next Meeting' },
  { id: 'done', label: 'Complete' },
];

const CHANNEL_BY_MODE: Record<MeetingMode, InteractionChannel> = {
  'In-Person': 'Site Visit',
  Virtual: 'Meeting',
  Phone: 'Call',
  Hybrid: 'Meeting',
};

const ISSUE_CATEGORIES: IssueCategory[] = ['Network', 'Billing', 'Service', 'Technical', 'Contract', 'Product'];
const ISSUE_PRIORITIES: IssuePriority[] = ['P1', 'P2', 'P3', 'P4'];
const OPP_STAGES: OpportunityStage[] = ['Discovery', 'Qualification', 'Proposal', 'Negotiation'];
const CAL_TYPES: CalendarType[] = ['QBR', 'Renewal', 'Review', 'Follow-up', 'Executive Meeting', 'Training'];
const MEETING_MODES: MeetingMode[] = ['In-Person', 'Virtual', 'Phone', 'Hybrid'];

export function MobileURMPage({ onNavigate }: MobileURMPageProps) {
  const {
    data,
    addInteraction,
    addIssue,
    updateIssue,
    addOpportunity,
    updateOpportunity,
    addMomSummary,
    addCalendarRecord,
    addSchedulingHistory,
    addNotification,
    updateAccount,
    updateCustomer360,
    addAccountabilityEvent,
  } = useStore();
  const toast = useToast();

  const [step, setStep] = useState<Step>('today');
  const [finalizing, setFinalizing] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [mode, setMode] = useState<MeetingMode>('In-Person');
  const [subject, setSubject] = useState('');
  const [summary, setSummary] = useState('');
  const [sentiment, setSentiment] = useState<'positive' | 'neutral' | 'negative'>('positive');
  const [duration, setDuration] = useState(30);
  const [discoveryNotes, setDiscoveryNotes] = useState('');
  const [capturedIssues, setCapturedIssues] = useState<Issue[]>([]);
  const [capturedOpps, setCapturedOpps] = useState<Opportunity[]>([]);
  const [commitments, setCommitments] = useState<{ id: string; task: string; owner: string; dueDate: string }[]>([]);
  const [momGenerated, setMomGenerated] = useState<MomSummary | null>(null);
  const [nextMeeting, setNextMeeting] = useState<{ date: string; time: string; durationMins: number; type: CalendarType; mode: MeetingMode; purpose: string }>({
    date: '',
    time: '10:00',
    durationMins: 60,
    type: 'Follow-up',
    mode: 'Virtual',
    purpose: '',
  });
  const [lateSchedulingReason, setLateSchedulingReason] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const account = useMemo(() => data.accounts.find((a) => a.id === selectedAccountId) || null, [data.accounts, selectedAccountId]);
  const contacts = useMemo(() => (selectedAccountId ? data.contacts.filter((c) => c.accountId === selectedAccountId) : []), [data.contacts, selectedAccountId]);
  const selectedContact = useMemo(() => contacts.find((c) => c.id === selectedContactId) || null, [contacts, selectedContactId]);
  const c360 = useMemo(() => (selectedAccountId ? data.customer360.find((c) => c.accountId === selectedAccountId) : null), [data.customer360, selectedAccountId]);

  // Today's interactions: calendar scheduled for today + recent interactions
  const today = new Date().toISOString().slice(0, 10);
  const todaysCalendar = useMemo(
    () => data.calendar.filter((c) => c.date === today && c.status === 'Scheduled').sort((a, b) => a.time.localeCompare(b.time)),
    [data.calendar, today],
  );
  const todaysInteractions = useMemo(
    () => data.interactions.filter((i) => i.date.slice(0, 10) === today).sort((a, b) => b.date.localeCompare(a.date)),
    [data.interactions, today],
  );

  const existingOpenIssues = useMemo(
    () => (account ? data.issues.filter((i) => i.accountId === account.id && i.status !== 'Resolved' && i.status !== 'Closed') : []),
    [data.issues, account],
  );
  const existingOpenOpps = useMemo(
    () => (account ? data.opportunities.filter((o) => o.accountId === account.id && o.stage !== 'Closed Won' && o.stage !== 'Closed Lost') : []),
    [data.opportunities, account],
  );
  const hasP1Issue = useMemo(
    () => capturedIssues.some((i) => i.priority === 'P1') || existingOpenIssues.some((i) => i.priority === 'P1'),
    [capturedIssues, existingOpenIssues],
  );
  const followUpRecommendation: FollowUpRecommendation | null = useMemo(
    () => (account ? recommendFollowUpWindow({ health: account.health, segment: account.segment, sentiment, hasP1Issue }) : null),
    [account, sentiment, hasP1Issue],
  );
  const nextMeetingIsSignificantlyLate =
    !!followUpRecommendation && !!nextMeeting.date && isSignificantlyLate(nextMeeting.date, followUpRecommendation);
  const schedulingConflicts = useMemo(
    () =>
      account && nextMeeting.date
        ? findSchedulingConflicts(data, {
            accountId: account.id,
            owner: account.relationshipManager,
            date: nextMeeting.date,
            time: nextMeeting.time,
            durationMins: nextMeeting.durationMins,
          })
        : [],
    [data, account, nextMeeting.date, nextMeeting.time, nextMeeting.durationMins],
  );

  const canProceed = (): boolean => {
    switch (step) {
      case 'today': return true;
      case 'account': return !!selectedAccountId;
      case 'mode': return !!mode;
      case 'simulate': return subject.trim().length > 0 && summary.trim().length > 0;
      case 'discovery': return true;
      case 'customer360': return true;
      case 'issue': return true;
      case 'opportunity': return true;
      case 'commitments': return true;
      case 'review': return true;
      case 'mom': return true;
      case 'schedule': return !nextMeetingIsSignificantlyLate || lateSchedulingReason.trim().length > 0;
      case 'done': return false;
      default: return false;
    }
  };

  const handleNext = () => {
    const order: Step[] = STEPS.map((s) => s.id);
    const idx = order.indexOf(step);
    if (idx < order.length - 1) setStep(order[idx + 1]);
  };

  const handleBack = () => {
    const order: Step[] = STEPS.map((s) => s.id);
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
  };

  const startFromCalendar = (cal: CalendarRecord) => {
    setSelectedAccountId(cal.accountId);
    setSelectedContactId(cal.contactId);
    setSubject(cal.title);
    setMode(cal.mode);
    setStep('mode');
  };

  const startNew = (acc?: Account) => {
    if (acc) {
      setSelectedAccountId(acc.id);
      const primary = data.contacts.find((c) => c.accountId === acc.id && c.isPrimary);
      setSelectedContactId(primary?.id || null);
      setStep('mode');
    } else {
      setStep('account');
    }
  };

  const finalize = () => {
    if (!account || finalizing) return;
    setFinalizing(true);
    setTimeout(() => commitFinalize(), 450);
  };

  const commitFinalize = () => {
    if (!account) return;
    const owner = account.relationshipManager;
    const now = new Date().toISOString();

    // 1. Create interaction record — this is the event the rest of the workflow hangs off
    const interaction: Interaction = {
      id: genId('int'),
      accountId: account.id,
      contactId: selectedContactId,
      channel: CHANNEL_BY_MODE[mode],
      direction: 'Outbound',
      subject: subject.trim(),
      summary: summary.trim(),
      date: now,
      durationMins: duration,
      owner,
      sentiment,
    };
    addInteraction(interaction);

    // 2. Create or update issues — reuse a still-open issue with a matching title instead of duplicating it
    let issuesCreated = 0;
    let issuesUpdated = 0;
    capturedIssues.forEach((iss) => {
      const match = findMatchingOpenIssue(iss.title, existingOpenIssues);
      if (match) {
        updateIssue(match.id, {
          description: `${match.description}\n\nUpdate from ${formatDate(today)} interaction: ${iss.description}`,
          updatedAt: today,
          priority: iss.priority === 'P1' ? 'P1' : match.priority,
          healthImpact: iss.priority === 'P1' ? 'red' : match.healthImpact,
        });
        issuesUpdated += 1;
      } else {
        addIssue(iss);
        issuesCreated += 1;
      }
    });

    // 3. Create or update opportunities — same reuse-by-name logic
    let oppsCreated = 0;
    let oppsUpdated = 0;
    capturedOpps.forEach((opp) => {
      const match = findMatchingOpenOpportunity(opp.name, existingOpenOpps);
      if (match) {
        updateOpportunity(match.id, {
          stage: opp.stage,
          probability: opp.probability,
          value: opp.value || match.value,
          updatedAt: today,
          nextStep: opp.nextStep || match.nextStep,
        });
        oppsUpdated += 1;
      } else {
        addOpportunity(opp);
        oppsCreated += 1;
      }
    });

    // 4. Update Customer 360 from interaction sentiment (history-tracked by the store)
    if (c360) {
      const c360Updates = sentimentCustomer360Updates(sentiment, c360);
      if (Object.keys(c360Updates).length > 0) {
        updateCustomer360(account.id, c360Updates, owner, 'Interaction Completion');
      }
    }

    // 5. Create MOM — regenerate the customer-facing summary now that the next meeting
    // (decided in a later step) is known, so it can reference the scheduled check-in.
    if (momGenerated) {
      addMomSummary({
        ...momGenerated,
        customerFacingSummary: buildCustomerFacingSummary({
          subject: subject || `interaction with ${account.name}`,
          commitments,
          nextMeeting: nextMeeting.date ? nextMeeting : null,
        }),
      });
    }

    // 6. Create accountability history for this interaction
    addAccountabilityEvent({
      id: genId('acc-evt'),
      accountId: account.id,
      type: 'Interaction Logged',
      title: `Interaction logged — ${subject}`,
      description: `${CHANNEL_BY_MODE[mode]} interaction with ${selectedContact?.name || 'contact'} logged with ${sentiment} sentiment. ${issuesCreated + issuesUpdated} issue(s) touched, ${oppsCreated + oppsUpdated} opportunity update(s), ${commitments.length} commitment(s) captured.`,
      actor: owner,
      date: today,
      impact: sentiment === 'negative' || hasP1Issue ? 'High' : 'Medium',
    });

    // 7. Create next meeting, carrying forward the late-scheduling justification if one was required
    if (nextMeeting.date) {
      const calId = genId('cal');
      const cal: CalendarRecord = {
        id: calId,
        accountId: account.id,
        contactId: selectedContactId,
        title: nextMeeting.purpose || `Follow-up with ${account.name}`,
        type: nextMeeting.type,
        date: nextMeeting.date,
        time: nextMeeting.time,
        durationMins: nextMeeting.durationMins,
        mode: nextMeeting.mode,
        location: nextMeeting.mode === 'In-Person' ? account.hqCity : 'Virtual',
        purpose: nextMeeting.purpose,
        notes: [
          `Scheduled from mobile URM after interaction: ${subject}`,
          nextMeetingIsSignificantlyLate && lateSchedulingReason.trim()
            ? `Late-scheduling justification: ${lateSchedulingReason.trim()}`
            : null,
        ]
          .filter(Boolean)
          .join(' — '),
        attendees: [owner, selectedContact?.name || ''].filter(Boolean),
        owner,
        status: 'Scheduled',
        createdAt: now,
      };
      addCalendarRecord(cal);
      addSchedulingHistory({
        id: genId('sch'),
        calendarId: calId,
        action: 'Scheduled',
        newDate: nextMeeting.date,
        newTime: nextMeeting.time,
        reason: nextMeetingIsSignificantlyLate ? lateSchedulingReason.trim() : undefined,
        actor: owner,
        timestamp: now,
      });
    }

    // 8. Update account last interaction
    updateAccount(account.id, { lastInteraction: today });

    // 9. Notifications
    addNotification({
      id: genId('not'),
      type: 'Interaction',
      title: `Interaction logged: ${account.name}`,
      message: `${CHANNEL_BY_MODE[mode]} — ${subject}. ${issuesCreated} new / ${issuesUpdated} updated issue(s), ${oppsCreated} new / ${oppsUpdated} updated opportunity(ies).`,
      accountId: account.id,
      createdAt: now,
      read: false,
      priority: capturedIssues.some((i) => i.priority === 'P1') ? 'high' : 'medium',
    });

    if (!nextMeeting.date && followUpRecommendation) {
      addNotification({
        id: genId('not'),
        type: 'System',
        title: `Follow-up recommended: ${account.name}`,
        message: `No next meeting was scheduled. Recommended window: ${followUpRecommendation.minDays}-${followUpRecommendation.maxDays} days (by ${formatDate(followUpRecommendation.idealDate)}) — ${followUpRecommendation.reasonLabel}.`,
        accountId: account.id,
        createdAt: now,
        read: false,
        priority: account.health === 'red' ? 'high' : 'medium',
      });
    }

    toast.success(`Interaction with ${account.name} saved.`);
    setFinalizing(false);
    setStep('done');
  };

  const resetWizard = () => {
    setStep('today');
    setSelectedAccountId(null);
    setSelectedContactId(null);
    setMode('In-Person');
    setSubject('');
    setSummary('');
    setSentiment('positive');
    setDuration(30);
    setDiscoveryNotes('');
    setCapturedIssues([]);
    setCapturedOpps([]);
    setCommitments([]);
    setMomGenerated(null);
    setNextMeeting({ date: '', time: '10:00', durationMins: 60, type: 'Follow-up', mode: 'Virtual', purpose: '' });
    setLateSchedulingReason('');
    setFinalizing(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Progress header */}
      <div className="sticky top-0 z-10 bg-white border-b border-ink-200 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => (step === 'today' ? onNavigate('/') : handleBack())} className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-xs font-medium text-ink-400">
            Step {stepIndex + 1} of {STEPS.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i <= stepIndex ? 'bg-brand-600' : 'bg-ink-200'}`}
            />
          ))}
        </div>
        <p className="mt-2 text-sm font-semibold text-ink-900">{STEPS[stepIndex].label}</p>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {step === 'today' && (
          <TodayStep
            todaysCalendar={todaysCalendar}
            todaysInteractions={todaysInteractions}
            accounts={data.accounts}
            onStartFromCalendar={startFromCalendar}
            onStartNew={startNew}
            onNavigate={onNavigate}
          />
        )}

        {step === 'account' && (
          <AccountStep
            accounts={data.accounts}
            selectedId={selectedAccountId}
            onSelect={(id) => {
              setSelectedAccountId(id);
              const primary = data.contacts.find((c) => c.accountId === id && c.isPrimary);
              setSelectedContactId(primary?.id || null);
            }}
          />
        )}

        {step === 'mode' && account && (
          <ModeStep
            account={account}
            contacts={contacts}
            selectedContactId={selectedContactId}
            onSelectContact={setSelectedContactId}
            mode={mode}
            setMode={setMode}
          />
        )}

        {step === 'simulate' && (
          <SimulateStep
            mode={mode}
            account={account}
            contact={selectedContact}
            subject={subject}
            setSubject={setSubject}
            summary={summary}
            setSummary={setSummary}
            sentiment={sentiment}
            setSentiment={setSentiment}
            duration={duration}
            setDuration={setDuration}
          />
        )}

        {step === 'discovery' && (
          <DiscoveryStep notes={discoveryNotes} setNotes={setDiscoveryNotes} account={account} contact={selectedContact} />
        )}

        {step === 'customer360' && account && (
          <Customer360Step account={account} c360={c360 ?? null} />
        )}

        {step === 'issue' && account && (
          <IssueStep
            account={account}
            capturedIssues={capturedIssues}
            setCapturedIssues={setCapturedIssues}
            existingIssues={data.issues.filter((i) => i.accountId === account.id)}
          />
        )}

        {step === 'opportunity' && account && (
          <OpportunityStep
            account={account}
            capturedOpps={capturedOpps}
            setCapturedOpps={setCapturedOpps}
            existingOpps={data.opportunities.filter((o) => o.accountId === account.id)}
          />
        )}

        {step === 'commitments' && account && (
          <CommitmentsStep
            account={account}
            contact={selectedContact}
            commitments={commitments}
            setCommitments={setCommitments}
          />
        )}

        {step === 'review' && account && (
          <ReviewStep
            account={account}
            contact={selectedContact}
            mode={mode}
            subject={subject}
            summary={summary}
            sentiment={sentiment}
            duration={duration}
            capturedIssues={capturedIssues}
            capturedOpps={capturedOpps}
            commitments={commitments}
            discoveryNotes={discoveryNotes}
            followUpRecommendation={followUpRecommendation}
          />
        )}

        {step === 'mom' && account && (
          <MomStep
            account={account}
            contact={selectedContact}
            subject={subject}
            summary={summary}
            discoveryNotes={discoveryNotes}
            capturedIssues={capturedIssues}
            capturedOpps={capturedOpps}
            commitments={commitments}
            nextMeeting={nextMeeting}
            momGenerated={momGenerated}
            setMomGenerated={setMomGenerated}
          />
        )}

        {step === 'schedule' && account && (
          <ScheduleStep
            account={account}
            contact={selectedContact}
            nextMeeting={nextMeeting}
            setNextMeeting={setNextMeeting}
            recommendation={followUpRecommendation}
            isSignificantlyLate={nextMeetingIsSignificantlyLate}
            lateSchedulingReason={lateSchedulingReason}
            setLateSchedulingReason={setLateSchedulingReason}
            conflicts={schedulingConflicts}
          />
        )}

        {step === 'done' && account && (
          <DoneStep account={account} onNavigate={onNavigate} onNew={resetWizard} />
        )}
      </div>

      {/* Sticky bottom action */}
      {step !== 'today' && step !== 'done' && (
        <div className="sticky bottom-0 bg-white border-t border-ink-200 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button
            onClick={step === 'schedule' ? finalize : handleNext}
            disabled={!canProceed() || finalizing}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-600 text-white text-base font-semibold shadow-sm hover:bg-brand-700 active:scale-[0.99] transition disabled:opacity-40 disabled:pointer-events-none"
          >
            {step === 'schedule' ? (
              <>
                {finalizing ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                {finalizing ? 'Saving…' : 'Complete & Save'}
              </>
            ) : (
              <>
                Next: {STEPS[stepIndex + 1]?.label} <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Step Components ──────────────────────────────────────────────

function TodayStep({
  todaysCalendar,
  todaysInteractions,
  accounts,
  onStartFromCalendar,
  onStartNew,
  onNavigate,
}: {
  todaysCalendar: CalendarRecord[];
  todaysInteractions: Interaction[];
  accounts: Account[];
  onStartFromCalendar: (cal: CalendarRecord) => void;
  onStartNew: (acc?: Account) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-ink-900 mb-1">Today's Plan</h2>
        <p className="text-sm text-ink-500">Start an interaction from today's schedule or pick any account.</p>
      </div>

      {todaysCalendar.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Scheduled Meetings</p>
          <div className="space-y-2">
            {todaysCalendar.map((cal) => {
              const acc = accounts.find((a) => a.id === cal.accountId);
              return (
                <button
                  key={cal.id}
                  onClick={() => onStartFromCalendar(cal)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-ink-200 hover:border-brand-400 hover:bg-brand-50/50 transition text-left active:scale-[0.99]"
                >
                  <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg bg-brand-600 text-white shrink-0">
                    <span className="text-xs font-medium">{cal.time.split(':')[0]}</span>
                    <span className="text-[10px]">{cal.time.split(':')[1]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{cal.title}</p>
                    <p className="text-xs text-ink-400">{acc?.name} · {cal.mode} · {cal.durationMins}m</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-ink-300 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {todaysInteractions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Logged Today</p>
          <div className="space-y-2">
            {todaysInteractions.map((int) => {
              const acc = accounts.find((a) => a.id === int.accountId);
              return (
                <div key={int.id} className="flex items-center gap-3 p-3 rounded-lg bg-ink-50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{int.subject}</p>
                    <p className="text-xs text-ink-400">{acc?.name} · {int.channel}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {todaysCalendar.length === 0 && todaysInteractions.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="h-10 w-10 text-ink-300 mx-auto mb-2" />
          <p className="text-sm text-ink-400">No meetings scheduled for today.</p>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Quick Start</p>
        <button
          onClick={() => onStartNew()}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-600 text-white text-base font-semibold shadow-sm hover:bg-brand-700 active:scale-[0.99] transition"
        >
          <Plus className="h-5 w-5" /> Start New Interaction
        </button>
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Or pick an account</p>
        <div className="space-y-2">
          {accounts.slice(0, 5).map((acc) => (
            <button
              key={acc.id}
              onClick={() => onStartNew(acc)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-ink-200 hover:border-brand-400 hover:bg-brand-50/50 transition text-left active:scale-[0.99]"
            >
              <AccountAvatar name={acc.name} gradient={acc.logoColor} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-900 truncate">{acc.name}</p>
                <p className="text-xs text-ink-400">{acc.industry} · {acc.hqCity}</p>
              </div>
              <HealthBadge health={acc.health} size="sm" />
            </button>
          ))}
        </div>
        <button onClick={() => onNavigate('/accounts')} className="w-full text-center text-sm text-brand-600 hover:text-brand-700 font-medium py-2 mt-1">
          View all accounts
        </button>
      </div>
    </div>
  );
}

function AccountStep({
  accounts,
  selectedId,
  onSelect,
}: {
  accounts: Account[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-ink-900 mb-1">Select Account</h2>
        <p className="text-sm text-ink-500">Choose the account for this interaction.</p>
      </div>
      <div className="space-y-2">
        {accounts.map((acc) => (
          <button
            key={acc.id}
            onClick={() => onSelect(acc.id)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition text-left active:scale-[0.99] ${
              selectedId === acc.id ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-ink-300'
            }`}
          >
            <AccountAvatar name={acc.name} gradient={acc.logoColor} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-900 truncate">{acc.name}</p>
              <p className="text-xs text-ink-400">{acc.industry} · {formatINR(acc.arr)} ARR</p>
            </div>
            {selectedId === acc.id && <Check className="h-5 w-5 text-brand-600 shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function ModeStep({
  account,
  contacts,
  selectedContactId,
  onSelectContact,
  mode,
  setMode,
}: {
  account: Account;
  contacts: Contact[];
  selectedContactId: string | null;
  onSelectContact: (id: string) => void;
  mode: MeetingMode;
  setMode: (m: MeetingMode) => void;
}) {
  const modeIcons: Record<MeetingMode, typeof Phone> = {
    'In-Person': MapPin,
    Virtual: Video,
    Phone: Phone,
    Hybrid: Zap,
  };
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-ink-900 mb-1">Interaction Mode</h2>
        <p className="text-sm text-ink-500">{account.name} — choose how you'll connect.</p>
      </div>

      {/* Contact selection */}
      <div>
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Contact</p>
        <div className="space-y-2">
          {contacts.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectContact(c.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition text-left active:scale-[0.99] ${
                selectedContactId === c.id ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-ink-300'
              }`}
            >
              <Avatar name={c.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-900 truncate">{c.name}</p>
                    <p className="text-xs text-ink-400">{c.role}</p>
                  </div>
                  {c.isPrimary && <Badge tone="brand" className="text-[10px] px-1.5 py-0">Primary</Badge>}
                  {selectedContactId === c.id && <Check className="h-4 w-4 text-brand-600" />}
                </button>
              ))}
            </div>
          </div>

      {/* Mode selection */}
      <div>
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Mode</p>
        <div className="grid grid-cols-2 gap-3">
          {MEETING_MODES.map((m) => {
            const Icon = modeIcons[m];
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex flex-col items-center gap-2 py-5 rounded-xl border-2 transition active:scale-[0.98] ${
                  active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600 hover:border-ink-300'
                }`}
              >
                <Icon className="h-7 w-7" />
                <span className="text-sm font-semibold">{m}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SimulateStep({
  mode,
  account,
  contact,
  subject,
  setSubject,
  summary,
  setSummary,
  sentiment,
  setSentiment,
  duration,
  setDuration,
}: {
  mode: MeetingMode;
  account: Account | null;
  contact: Contact | null;
  subject: string;
  setSubject: (v: string) => void;
  summary: string;
  setSummary: (v: string) => void;
  sentiment: 'positive' | 'neutral' | 'negative';
  setSentiment: (v: 'positive' | 'neutral' | 'negative') => void;
  duration: number;
  setDuration: (v: number) => void;
}) {
  const [simState, setSimState] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle');
  const [simSeconds, setSimSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startSim = () => {
    setSimState('connecting');
    setTimeout(() => {
      setSimState('active');
      setSimSeconds(0);
      timerRef.current = setInterval(() => setSimSeconds((s) => s + 1), 1000);
    }, 1500);
  };

  const endSim = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSimState('ended');
    setDuration(Math.max(1, Math.round(simSeconds / 60)));
  };

  const fmtTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const simIcon = mode === 'Phone' ? PhoneCall : mode === 'Virtual' ? Video : MapPin;
  const SimIcon = simIcon;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-ink-900 mb-1">Start Interaction</h2>
        <p className="text-sm text-ink-500">{account?.name} · {contact?.name || 'No contact'} · {mode}</p>
      </div>

      {/* Simulation */}
      <div className="rounded-2xl border-2 border-ink-200 overflow-hidden">
        <div className="bg-gradient-to-br from-ink-800 to-ink-900 px-5 py-6 text-center text-white">
          {simState === 'idle' && (
            <>
              <SimIcon className="h-12 w-12 mx-auto mb-3 opacity-80" />
              <p className="text-sm text-ink-300 mb-4">Ready to start {mode.toLowerCase()} interaction</p>
              <button onClick={startSim} className="px-6 py-3 rounded-full bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition active:scale-95">
                {mode === 'Phone' ? 'Dial Now' : mode === 'Virtual' ? 'Join Meeting' : 'Check In'}
              </button>
            </>
          )}
          {simState === 'connecting' && (
            <div className="py-2">
              <div className="h-12 w-12 mx-auto mb-3 rounded-full border-4 border-white/20 border-t-white animate-spin" />
              <p className="text-sm text-ink-300">{mode === 'Phone' ? 'Dialing...' : mode === 'Virtual' ? 'Connecting...' : 'Checking in...'}</p>
            </div>
          )}
          {simState === 'active' && (
            <>
              <div className="h-12 w-12 mx-auto mb-2 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <SimIcon className="h-6 w-6 text-emerald-400" />
              </div>
              <p className="text-2xl font-mono font-bold mb-1">{fmtTime(simSeconds)}</p>
              <p className="text-xs text-ink-400 mb-3">In progress</p>
              <button onClick={endSim} className="px-6 py-2.5 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition active:scale-95 flex items-center gap-2 mx-auto">
                {mode === 'Phone' ? <PhoneOff className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                End {mode === 'Phone' ? 'Call' : 'Meeting'}
              </button>
            </>
          )}
          {simState === 'ended' && (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-emerald-400" />
              <p className="text-sm text-ink-300 mb-1">Interaction completed</p>
              <p className="text-lg font-semibold">{duration} minutes</p>
            </>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-ink-700 mb-1.5 block">Subject</label>
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What is this interaction about?" className="input" />
        </div>
        <div>
          <label className="text-sm font-medium text-ink-700 mb-1.5 block">Summary</label>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Key discussion points..." rows={4} className="input resize-none" />
        </div>
        <div>
          <label className="text-sm font-medium text-ink-700 mb-1.5 block">Sentiment</label>
          <div className="grid grid-cols-3 gap-2">
            {(['positive', 'neutral', 'negative'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSentiment(s)}
                className={`py-2.5 rounded-xl border-2 text-sm font-medium capitalize transition ${
                  sentiment === s
                    ? s === 'positive' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : s === 'negative' ? 'border-red-500 bg-red-50 text-red-700' : 'border-ink-400 bg-ink-50 text-ink-700'
                    : 'border-ink-200 text-ink-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-ink-700 mb-1.5 block">Duration: {duration} min</label>
          <input type="range" min={5} max={180} step={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full accent-brand-600" />
        </div>
      </div>
    </div>
  );
}

function DiscoveryStep({ notes, setNotes, account, contact }: { notes: string; setNotes: (v: string) => void; account: Account | null; contact: Contact | null }) {
  const prompts = [
    'What are the customer\'s current priorities?',
    'Any pain points or challenges mentioned?',
    'What solutions are they evaluating?',
    'Budget or timeline constraints?',
    'Who else is involved in the decision?',
  ];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-ink-900 mb-1">Guided Discovery</h2>
        <p className="text-sm text-ink-500">{account?.name} · {contact?.name || 'No contact'}</p>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">Discovery Prompts</p>
        {prompts.map((p, i) => (
          <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <Sparkles className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-ink-700">{p}</p>
          </div>
        ))}
      </div>
      <div>
        <label className="text-sm font-medium text-ink-700 mb-1.5 block">Discovery Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Capture key findings, needs, and insights..." rows={6} className="input resize-none" />
      </div>
    </div>
  );
}

function Customer360Step({ account, c360 }: { account: Account; c360: ReturnType<typeof useStore>['data']['customer360'][number] | null }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-ink-900 mb-1">Customer 360</h2>
        <p className="text-sm text-ink-500">Context for {account.name}</p>
      </div>

      <div className="rounded-xl border border-ink-200 p-4 space-y-4">
        <div className="flex items-center gap-3">
          <AccountAvatar name={account.name} gradient={account.logoColor} size="md" />
          <div>
            <p className="font-semibold text-ink-900">{account.name}</p>
            <p className="text-xs text-ink-400">{account.industry} · {account.segment}</p>
          </div>
          <HealthBadge health={account.health} size="sm" />
        </div>

        {c360 ? (
          <>
            <p className="text-sm text-ink-600 leading-relaxed">{c360.overview}</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-ink-50">
                <p className="text-xs text-ink-400">Satisfaction</p>
                <div className="flex items-center gap-2 mt-1">
                  <ProgressBar value={c360.satisfactionScore} tone={c360.satisfactionScore >= 75 ? 'green' : c360.satisfactionScore >= 50 ? 'amber' : 'red'} />
                  <span className="text-sm font-semibold">{c360.satisfactionScore}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-ink-50">
                <p className="text-xs text-ink-400">NPS</p>
                <p className={`text-lg font-bold ${c360.npsScore >= 50 ? 'text-emerald-600' : c360.npsScore >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  {c360.npsScore > 0 ? '+' : ''}{c360.npsScore}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink-400 uppercase mb-1.5">Objectives</p>
              <ul className="space-y-1">
                {c360.objectives.map((o, i) => (
                  <li key={i} className="text-sm text-ink-600 flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" /> {o}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink-400 uppercase mb-1.5">Products Used</p>
              <div className="flex flex-wrap gap-1.5">
                {c360.productsUsed.map((p, i) => <Badge key={i} tone="blue">{p}</Badge>)}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink-400 uppercase mb-1.5">Key Risks</p>
              <ul className="space-y-1">
                {c360.keyRisks.map((r, i) => (
                  <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {r}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="text-sm text-ink-400 text-center py-4">No Customer 360 data available.</p>
        )}
      </div>
    </div>
  );
}

function IssueStep({
  account,
  capturedIssues,
  setCapturedIssues,
  existingIssues,
}: {
  account: Account;
  capturedIssues: Issue[];
  setCapturedIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  existingIssues: Issue[];
}) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('P2');
  const [category, setCategory] = useState<IssueCategory>('Technical');

  const addIssue = () => {
    if (!title.trim()) return;
    const now = new Date().toISOString().slice(0, 10);
    const iss: Issue = {
      id: genId('iss'),
      accountId: account.id,
      title: title.trim(),
      description: desc.trim() || '—',
      status: 'Open',
      priority,
      category,
      assignedTo: account.relationshipManager,
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      healthImpact: priority === 'P1' ? 'red' : 'amber',
    };
    setCapturedIssues((prev) => [...prev, iss]);
    setTitle('');
    setDesc('');
    setPriority('P2');
    setCategory('Technical');
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-ink-900 mb-1">Issue Capture</h2>
        <p className="text-sm text-ink-500">Log new issues for {account.name}</p>
      </div>

      {existingIssues.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ink-400 uppercase mb-2">Existing Issues ({existingIssues.length})</p>
          <div className="space-y-1.5">
            {existingIssues.slice(0, 4).map((iss) => (
              <div key={iss.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-ink-50">
                <Badge tone={iss.priority === 'P1' ? 'red' : iss.priority === 'P2' ? 'amber' : 'neutral'} className="text-[10px] px-1.5">{iss.priority}</Badge>
                <p className="text-sm text-ink-700 truncate flex-1">{iss.title}</p>
                <Badge tone="neutral" className="text-[10px] px-1.5">{iss.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border-2 border-ink-200 p-4 space-y-3">
        <p className="text-sm font-semibold text-ink-900">Add New Issue</p>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Issue title" className="input" />
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description..." rows={2} className="input resize-none" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-ink-400 mb-1 block">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as IssuePriority)} className="input">
              {ISSUE_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-ink-400 mb-1 block">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as IssueCategory)} className="input">
              {ISSUE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button onClick={addIssue} disabled={!title.trim()} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold disabled:opacity-40 active:scale-[0.99] transition">
          <Plus className="h-4 w-4" /> Add Issue
        </button>
      </div>

      {capturedIssues.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ink-400 uppercase mb-2">Captured ({capturedIssues.length})</p>
          <div className="space-y-2">
            {capturedIssues.map((iss) => (
              <div key={iss.id} className="flex items-center gap-2 p-3 rounded-lg border border-ink-200">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{iss.title}</p>
                  <p className="text-xs text-ink-400">{iss.priority} · {iss.category}</p>
                </div>
                <button onClick={() => setCapturedIssues((prev) => prev.filter((x) => x.id !== iss.id))} className="p-2 -m-2 rounded-lg text-ink-300 hover:text-red-500 hover:bg-red-50 transition" aria-label="Remove issue">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OpportunityStep({
  account,
  capturedOpps,
  setCapturedOpps,
  existingOpps,
}: {
  account: Account;
  capturedOpps: Opportunity[];
  setCapturedOpps: React.Dispatch<React.SetStateAction<Opportunity[]>>;
  existingOpps: Opportunity[];
}) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [stage, setStage] = useState<OpportunityStage>('Discovery');
  const [probability, setProbability] = useState(25);

  const addOpp = () => {
    if (!name.trim()) return;
    const now = new Date().toISOString().slice(0, 10);
    const opp: Opportunity = {
      id: genId('opp'),
      accountId: account.id,
      name: name.trim(),
      stage,
      value: Number(value) || 0,
      probability,
      expectedClose: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
      owner: account.relationshipManager,
      products: [],
      createdAt: now,
      updatedAt: now,
      nextStep: 'Follow up from mobile interaction',
    };
    setCapturedOpps((prev) => [...prev, opp]);
    setName('');
    setValue('');
    setStage('Discovery');
    setProbability(25);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-ink-900 mb-1">Opportunity Capture</h2>
        <p className="text-sm text-ink-500">Log new opportunities for {account.name}</p>
      </div>

      {existingOpps.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ink-400 uppercase mb-2">Existing Opportunities ({existingOpps.length})</p>
          <div className="space-y-1.5">
            {existingOpps.slice(0, 4).map((opp) => (
              <div key={opp.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-ink-50">
                <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                <p className="text-sm text-ink-700 truncate flex-1">{opp.name}</p>
                <Badge tone="neutral" className="text-[10px] px-1.5">{opp.stage}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border-2 border-ink-200 p-4 space-y-3">
        <p className="text-sm font-semibold text-ink-900">Add New Opportunity</p>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Opportunity name" className="input" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-ink-400 mb-1 block">Value (₹ Lakhs)</label>
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" className="input" />
          </div>
          <div>
            <label className="text-xs text-ink-400 mb-1 block">Stage</label>
            <select value={stage} onChange={(e) => setStage(e.target.value as OpportunityStage)} className="input">
              {OPP_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-ink-400 mb-1 block">Probability: {probability}%</label>
          <input type="range" min={0} max={100} step={5} value={probability} onChange={(e) => setProbability(Number(e.target.value))} className="w-full accent-brand-600" />
        </div>
        <button onClick={addOpp} disabled={!name.trim()} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold disabled:opacity-40 active:scale-[0.99] transition">
          <Plus className="h-4 w-4" /> Add Opportunity
        </button>
      </div>

      {capturedOpps.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ink-400 uppercase mb-2">Captured ({capturedOpps.length})</p>
          <div className="space-y-2">
            {capturedOpps.map((opp) => (
              <div key={opp.id} className="flex items-center gap-2 p-3 rounded-lg border border-ink-200">
                <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{opp.name}</p>
                  <p className="text-xs text-ink-400">{formatINR(opp.value)} · {opp.stage} · {opp.probability}%</p>
                </div>
                <button onClick={() => setCapturedOpps((prev) => prev.filter((x) => x.id !== opp.id))} className="p-2 -m-2 rounded-lg text-ink-300 hover:text-red-500 hover:bg-red-50 transition" aria-label="Remove opportunity">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CommitmentsStep({
  account,
  contact,
  commitments,
  setCommitments,
}: {
  account: Account;
  contact: Contact | null;
  commitments: { id: string; task: string; owner: string; dueDate: string }[];
  setCommitments: React.Dispatch<React.SetStateAction<{ id: string; task: string; owner: string; dueDate: string }[]>>;
}) {
  const [task, setTask] = useState('');
  const [owner, setOwner] = useState(account.relationshipManager);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));

  const addCommitment = () => {
    if (!task.trim()) return;
    setCommitments((prev) => [...prev, { id: genId('cmt'), task: task.trim(), owner: owner.trim() || account.relationshipManager, dueDate }]);
    setTask('');
    setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-ink-900 mb-1">Commitments</h2>
        <p className="text-sm text-ink-500">What did we commit to, and by when?</p>
      </div>

      <div className="rounded-xl border-2 border-ink-200 p-4 space-y-3">
        <p className="text-sm font-semibold text-ink-900">Add Commitment</p>
        <input type="text" value={task} onChange={(e) => setTask(e.target.value)} placeholder="e.g. Send pricing proposal" className="input" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-ink-400 mb-1 block">Owner</label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setOwner(account.relationshipManager)}
                className={`flex-1 py-2 rounded-lg border-2 text-xs font-medium truncate transition ${owner === account.relationshipManager ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-500'}`}
              >
                Us ({account.relationshipManager.split(' ')[0]})
              </button>
              {contact && (
                <button
                  type="button"
                  onClick={() => setOwner(contact.name)}
                  className={`flex-1 py-2 rounded-lg border-2 text-xs font-medium truncate transition ${owner === contact.name ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-500'}`}
                >
                  {contact.name.split(' ')[0]}
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs text-ink-400 mb-1 block">Due Date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
          </div>
        </div>
        <button onClick={addCommitment} disabled={!task.trim()} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold disabled:opacity-40 active:scale-[0.99] transition">
          <Plus className="h-4 w-4" /> Add Commitment
        </button>
      </div>

      {commitments.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-ink-400 uppercase mb-2">Captured ({commitments.length})</p>
          <div className="space-y-2">
            {commitments.map((c) => (
              <div key={c.id} className="flex items-center gap-2 p-3 rounded-lg border border-ink-200">
                <ClipboardList className="h-4 w-4 text-brand-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{c.task}</p>
                  <p className="text-xs text-ink-400">{c.owner} · Due {formatDate(c.dueDate)}</p>
                </div>
                <button onClick={() => setCommitments((prev) => prev.filter((x) => x.id !== c.id))} className="p-2 -m-2 rounded-lg text-ink-300 hover:text-red-500 hover:bg-red-50 transition" aria-label="Remove commitment">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-ink-400 text-center">No commitments? Skip this step if nothing was promised.</p>
      )}
    </div>
  );
}

function ReviewStep({
  account,
  contact,
  mode,
  subject,
  summary,
  sentiment,
  duration,
  capturedIssues,
  capturedOpps,
  commitments,
  discoveryNotes,
  followUpRecommendation,
}: {
  account: Account;
  contact: Contact | null;
  mode: MeetingMode;
  subject: string;
  summary: string;
  sentiment: string;
  duration: number;
  capturedIssues: Issue[];
  capturedOpps: Opportunity[];
  commitments: { id: string; task: string; owner: string; dueDate: string }[];
  discoveryNotes: string;
  followUpRecommendation: FollowUpRecommendation | null;
}) {
  const rows = [
    { icon: Building2, label: 'Account', value: account.name },
    { icon: User, label: 'Contact', value: contact?.name || '—' },
    { icon: MapPin, label: 'Mode', value: mode },
    { icon: FileText, label: 'Subject', value: subject },
    { icon: Clock, label: 'Duration', value: `${duration} min` },
    { icon: Sparkles, label: 'Sentiment', value: sentiment },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-ink-900 mb-1">Completion Review</h2>
        <p className="text-sm text-ink-500">Review before saving</p>
      </div>

      <div className="rounded-xl border border-ink-200 divide-y divide-ink-100">
        {rows.map((r, i) => {
          const Icon = r.icon;
          return (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="h-8 w-8 rounded-lg bg-ink-100 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-ink-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ink-400">{r.label}</p>
                <p className="text-sm font-medium text-ink-900 truncate">{r.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {summary && (
        <div className="rounded-xl border border-ink-200 p-3">
          <p className="text-xs text-ink-400 mb-1">Summary</p>
          <p className="text-sm text-ink-700">{summary}</p>
        </div>
      )}

      {discoveryNotes && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
          <p className="text-xs text-blue-400 mb-1">Discovery Notes</p>
          <p className="text-sm text-ink-700">{discoveryNotes}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-ink-200 p-3 text-center">
          <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-ink-900">{capturedIssues.length}</p>
          <p className="text-xs text-ink-400">Issues</p>
        </div>
        <div className="rounded-xl border border-ink-200 p-3 text-center">
          <TrendingUp className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-ink-900">{capturedOpps.length}</p>
          <p className="text-xs text-ink-400">Opportunities</p>
        </div>
        <div className="rounded-xl border border-ink-200 p-3 text-center">
          <ClipboardList className="h-5 w-5 text-brand-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-ink-900">{commitments.length}</p>
          <p className="text-xs text-ink-400">Commitments</p>
        </div>
      </div>

      {followUpRecommendation && (
        <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3 flex items-start gap-2.5">
          <Clock className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-brand-800">
              Recommended follow-up: {followUpRecommendation.minDays}–{followUpRecommendation.maxDays} days
            </p>
            <p className="text-xs text-brand-600 mt-0.5">
              By {formatDate(followUpRecommendation.idealDate)} — based on {followUpRecommendation.reasonLabel}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function MomStep({
  account,
  contact,
  subject,
  summary,
  discoveryNotes,
  capturedIssues,
  capturedOpps,
  commitments,
  nextMeeting,
  momGenerated,
  setMomGenerated,
}: {
  account: Account;
  contact: Contact | null;
  subject: string;
  summary: string;
  discoveryNotes: string;
  capturedIssues: Issue[];
  capturedOpps: Opportunity[];
  commitments: { id: string; task: string; owner: string; dueDate: string }[];
  nextMeeting: { date: string; time: string; durationMins: number; type: CalendarType; mode: MeetingMode; purpose: string };
  momGenerated: MomSummary | null;
  setMomGenerated: (m: MomSummary | null) => void;
}) {
  const generate = () => {
    const now = new Date().toISOString().slice(0, 10);
    const owner = account.relationshipManager;
    const agenda: string[] = [];
    if (subject) agenda.push(subject);
    if (discoveryNotes) agenda.push('Discovery and needs assessment');

    const decisions: string[] = [];
    if (summary) decisions.push(summary);

    // Commitments made during the call are the primary source of action items,
    // topped up with follow-ups implied by any issue/opportunity captured this call.
    const actionItems = [
      ...commitments.map((c) => ({ id: genId('act'), task: c.task, owner: c.owner, dueDate: c.dueDate, done: false })),
      ...capturedIssues.map((iss) => ({
        id: genId('act'),
        task: `Resolve: ${iss.title}`,
        owner: iss.assignedTo,
        dueDate: iss.dueDate,
        done: false,
      })),
      ...capturedOpps.map((opp) => ({
        id: genId('act'),
        task: `Follow up: ${opp.name}`,
        owner: opp.owner,
        dueDate: opp.expectedClose,
        done: false,
      })),
    ];

    const mom: MomSummary = {
      id: genId('mom'),
      accountId: account.id,
      title: subject || `Interaction with ${account.name}`,
      meetingDate: now,
      attendees: [`${owner} (RM)`, contact ? `${contact.name} (${contact.role})` : ''].filter(Boolean),
      agenda: agenda.length > 0 ? agenda : ['Interaction discussion'],
      decisions: decisions.length > 0 ? decisions : ['Discussion completed'],
      actionItems,
      createdBy: owner,
      createdAt: now,
      customerFacingSummary: buildCustomerFacingSummary({
        subject: subject || `interaction with ${account.name}`,
        commitments,
        nextMeeting: nextMeeting.date ? nextMeeting : null,
      }),
    };
    setMomGenerated(mom);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-ink-900 mb-1">MOM Generation</h2>
        <p className="text-sm text-ink-500">Auto-generate internal minutes and a customer-safe summary</p>
      </div>

      {!momGenerated ? (
        <button onClick={generate} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-600 text-white text-base font-semibold active:scale-[0.99] transition">
          <Sparkles className="h-5 w-5" /> Generate MOM
        </button>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-700">Internal MOM Generated</p>
            </div>
            <div>
              <p className="font-semibold text-ink-900">{momGenerated.title}</p>
              <p className="text-xs text-ink-400 mt-0.5">{formatDate(momGenerated.meetingDate)} · {momGenerated.attendees.join(', ')}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-400 uppercase mb-1">Agenda</p>
              <ul className="space-y-0.5">
                {momGenerated.agenda.map((a, i) => <li key={i} className="text-sm text-ink-600 flex items-start gap-2"><span className="text-ink-300">•</span> {a}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-400 uppercase mb-1">Decisions</p>
              <ul className="space-y-0.5">
                {momGenerated.decisions.map((d, i) => <li key={i} className="text-sm text-ink-600 flex items-start gap-2"><span className="text-emerald-500">✓</span> {d}</li>)}
              </ul>
            </div>
            {momGenerated.actionItems.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-ink-400 uppercase mb-1">Action Items ({momGenerated.actionItems.length})</p>
                <ul className="space-y-0.5">
                  {momGenerated.actionItems.map((a) => (
                    <li key={a.id} className="text-sm text-ink-600 flex items-start gap-2">
                      <span className="text-ink-300">○</span>
                      <span>{a.task} — <span className="text-xs text-ink-400">{a.owner} · {formatDate(a.dueDate)}</span></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="rounded-xl border-2 border-blue-200 bg-blue-50/50 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-semibold text-blue-700">Customer-Facing Summary</p>
            </div>
            <p className="text-xs text-blue-500">Safe to share externally — internal risk, health, and accountability details are excluded.</p>
            <p className="text-sm text-ink-700 whitespace-pre-line">{momGenerated.customerFacingSummary}</p>
          </div>

          <button onClick={generate} className="text-xs text-brand-600 font-medium hover:text-brand-700">Regenerate</button>
        </div>
      )}
    </div>
  );
}

function ScheduleStep({
  account,
  contact,
  nextMeeting,
  setNextMeeting,
  recommendation,
  isSignificantlyLate,
  lateSchedulingReason,
  setLateSchedulingReason,
  conflicts,
}: {
  account: Account;
  contact: Contact | null;
  nextMeeting: { date: string; time: string; durationMins: number; type: CalendarType; mode: MeetingMode; purpose: string };
  setNextMeeting: React.Dispatch<React.SetStateAction<{ date: string; time: string; durationMins: number; type: CalendarType; mode: MeetingMode; purpose: string }>>;
  recommendation: FollowUpRecommendation | null;
  isSignificantlyLate: boolean;
  lateSchedulingReason: string;
  setLateSchedulingReason: (v: string) => void;
  conflicts: CalendarRecord[];
}) {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-ink-900 mb-1">Schedule Next Meeting</h2>
        <p className="text-sm text-ink-500">{account.name} · {contact?.name || 'No contact'}</p>
      </div>

      {recommendation && (
        <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3 flex items-start gap-2.5">
          <Clock className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-brand-800">
              Recommended: within {recommendation.minDays}–{recommendation.maxDays} days (by {formatDate(recommendation.idealDate)})
            </p>
            <p className="text-xs text-brand-600 mt-0.5">Based on {recommendation.reasonLabel}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Quick date buttons */}
        <div>
          <label className="text-sm font-medium text-ink-700 mb-1.5 block">Date</label>
          <div className="flex gap-2 mb-2">
            <button onClick={() => setNextMeeting((p) => ({ ...p, date: tomorrow }))} className="px-3 py-2 rounded-lg border-2 border-ink-200 text-sm font-medium hover:border-brand-400 transition">Tomorrow</button>
            <button onClick={() => setNextMeeting((p) => ({ ...p, date: nextWeek }))} className="px-3 py-2 rounded-lg border-2 border-ink-200 text-sm font-medium hover:border-brand-400 transition">Next Week</button>
            {recommendation && (
              <button onClick={() => setNextMeeting((p) => ({ ...p, date: recommendation.idealDate }))} className="px-3 py-2 rounded-lg border-2 border-brand-300 bg-brand-50 text-brand-700 text-sm font-medium hover:border-brand-400 transition">Recommended</button>
            )}
          </div>
          <input type="date" value={nextMeeting.date} onChange={(e) => setNextMeeting((p) => ({ ...p, date: e.target.value }))} className="input" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-ink-700 mb-1.5 block">Time</label>
            <input type="time" value={nextMeeting.time} onChange={(e) => setNextMeeting((p) => ({ ...p, time: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="text-sm font-medium text-ink-700 mb-1.5 block">Duration</label>
            <select value={nextMeeting.durationMins} onChange={(e) => setNextMeeting((p) => ({ ...p, durationMins: Number(e.target.value) }))} className="input">
              {[15, 30, 45, 60, 90, 120].map((d) => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-ink-700 mb-1.5 block">Type</label>
          <select value={nextMeeting.type} onChange={(e) => setNextMeeting((p) => ({ ...p, type: e.target.value as CalendarType }))} className="input">
            {CAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-ink-700 mb-1.5 block">Mode</label>
          <div className="grid grid-cols-4 gap-2">
            {MEETING_MODES.map((m) => (
              <button
                key={m}
                onClick={() => setNextMeeting((p) => ({ ...p, mode: m }))}
                className={`py-2 rounded-lg border-2 text-xs font-medium transition ${nextMeeting.mode === m ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-500'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-ink-700 mb-1.5 block">Purpose</label>
          <input type="text" value={nextMeeting.purpose} onChange={(e) => setNextMeeting((p) => ({ ...p, purpose: e.target.value }))} placeholder="What is the next meeting about?" className="input" />
        </div>

        {nextMeeting.date && (
          <div className="rounded-lg bg-brand-50 border border-brand-100 p-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand-600 shrink-0" />
            <p className="text-sm text-brand-700">
              {formatDate(nextMeeting.date)} at {nextMeeting.time} · {nextMeeting.durationMins}m · {nextMeeting.mode}
            </p>
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-1.5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-800">Scheduling conflict — this overlaps {conflicts.length} other meeting{conflicts.length > 1 ? 's' : ''}:</p>
            </div>
            <ul className="pl-6 space-y-0.5">
              {conflicts.map((c) => (
                <li key={c.id} className="text-xs text-red-700">{c.title} · {c.time} ({c.durationMins}m) · {c.owner}</li>
              ))}
            </ul>
          </div>
        )}

        {isSignificantlyLate && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                This is significantly later than the recommended window. A reason is required to proceed.
              </p>
            </div>
            <textarea
              value={lateSchedulingReason}
              onChange={(e) => setLateSchedulingReason(e.target.value)}
              placeholder="Why is the next meeting being scheduled this far out?"
              rows={2}
              className="input resize-none"
            />
          </div>
        )}

        {!nextMeeting.date && (
          <p className="text-xs text-ink-400 text-center">Skip this step if no follow-up is needed.</p>
        )}
      </div>
    </div>
  );
}

function DoneStep({ account, onNavigate, onNew }: { account: Account; onNavigate: (path: string) => void; onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 space-y-5">
      <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-ink-900 mb-1">Interaction Complete</h2>
        <p className="text-sm text-ink-500">All details saved for {account.name}</p>
      </div>

      <div className="w-full space-y-2">
        <button onClick={onNew} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-600 text-white text-base font-semibold active:scale-[0.99] transition">
          <Plus className="h-5 w-5" /> Start Another
        </button>
        <button onClick={() => onNavigate(`/accounts/${account.id}`)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-ink-200 text-ink-700 text-base font-semibold active:scale-[0.99] transition">
          <Building2 className="h-5 w-5" /> View Account
        </button>
        <button onClick={() => onNavigate('/')} className="w-full text-sm text-ink-500 hover:text-ink-700 font-medium py-2">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
