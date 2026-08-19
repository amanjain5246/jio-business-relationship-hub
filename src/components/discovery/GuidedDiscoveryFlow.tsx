import { useMemo, useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/ToastProvider';
import { formatDate, formatINR, genId, daysUntil } from '@/utils/format';
import {
  isDissatisfiedRating,
  satisfactionScoreForRating,
  engagementTrendForRating,
  nudgeNpsForStance,
  categoryForDissatisfactionReasons,
  buildDefaultKeyFindings,
  DISSATISFACTION_REASONS,
  PRODUCT_CATALOG,
} from '@/utils/discoveryEngine';
import type {
  Account,
  Customer360,
  DiscoverySession,
  DiscoveryInteractionType,
  CustomerExperienceRating,
  AdvocacyStance,
  ExpansionPotential,
  DiscoveryStakeholder,
  Issue,
  Opportunity,
  NotificationItem,
} from '@/types/models';
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Users,
  Building2,
  FileText,
  ClipboardList,
  CheckCircle2,
  Check,
  X,
  Plus,
  MessageSquare,
  User,
} from 'lucide-react';

interface GuidedDiscoveryFlowProps {
  account: Account;
  onCancel: () => void;
  onComplete: (session: DiscoverySession) => void;
}

type StepId =
  | 'type'
  | 'previous'
  | 'experience'
  | 'care'
  | 'growth'
  | 'product'
  | 'competitor'
  | 'advocacy'
  | 'painpoints'
  | 'stakeholders'
  | 'contract'
  | 'review';

const STEP_DEFS: { id: StepId; label: string; icon: typeof Users }[] = [
  { id: 'type', label: 'Interaction Type', icon: User },
  { id: 'previous', label: 'Previous Context', icon: ClipboardList },
  { id: 'experience', label: 'Customer Experience', icon: MessageSquare },
  { id: 'care', label: 'Customer Care Awareness', icon: ShieldCheck },
  { id: 'growth', label: 'Business Growth', icon: TrendingUp },
  { id: 'product', label: 'Product Opportunities', icon: TrendingUp },
  { id: 'competitor', label: 'Competitor Discovery', icon: AlertTriangle },
  { id: 'advocacy', label: 'Customer Advocacy', icon: CheckCircle2 },
  { id: 'painpoints', label: 'Pain Points', icon: AlertTriangle },
  { id: 'stakeholders', label: 'Stakeholders', icon: Users },
  { id: 'contract', label: 'Contract Context', icon: Building2 },
  { id: 'review', label: 'Review & Save', icon: FileText },
];

const EXPERIENCE_RATINGS: CustomerExperienceRating[] = [
  'Very Dissatisfied',
  'Dissatisfied',
  'Neutral',
  'Satisfied',
  'Very Satisfied',
];

const EXPANSION_LEVELS: ExpansionPotential[] = ['None', 'Low', 'Medium', 'High'];
const ADVOCACY_STANCES: AdvocacyStance[] = ['Detractor', 'Passive', 'Promoter'];

interface FormState {
  contactId: string | null;
  interactionType: DiscoveryInteractionType;
  whatChangedSinceLast: string;
  experienceRating: CustomerExperienceRating | null;
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
}

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition ${
          value === true ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600 hover:border-ink-300'
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition ${
          value === false ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600 hover:border-ink-300'
        }`}
      >
        No
      </button>
    </div>
  );
}

function ChipMultiSelect({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (opt: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`chip border transition ${
              active ? 'bg-brand-50 text-brand-700 border-brand-300' : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
            }`}
          >
            {active && <Check className="h-3 w-3" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function TagInput({
  values,
  onAdd,
  onRemove,
  placeholder,
}: {
  values: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');
  const submit = () => {
    const v = draft.trim();
    if (!v) return;
    onAdd(v);
    setDraft('');
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          className="input"
        />
        <Button type="button" onClick={submit}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((v, i) => (
            <span key={i} className="chip bg-ink-100 text-ink-700">
              {v}
              <button type="button" onClick={() => onRemove(v)} className="p-1 -m-1 rounded-full hover:text-red-600 hover:bg-red-50 transition" aria-label={`Remove ${v}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function GuidedDiscoveryFlow({ account, onCancel, onComplete }: GuidedDiscoveryFlowProps) {
  const {
    data,
    addIssue,
    updateIssue,
    addOpportunity,
    updateOpportunity,
    updateCustomer360,
    addDiscoverySession,
    addNotification,
    addAccountabilityEvent,
  } = useStore();
  const toast = useToast();

  const contacts = useMemo(() => data.contacts.filter((c) => c.accountId === account.id), [data.contacts, account.id]);
  const accountInteractions = useMemo(
    () => data.interactions.filter((i) => i.accountId === account.id).sort((a, b) => b.date.localeCompare(a.date)),
    [data.interactions, account.id],
  );
  const priorSessions = useMemo(
    () => data.discoverySessions.filter((s) => s.accountId === account.id).sort((a, b) => b.date.localeCompare(a.date)),
    [data.discoverySessions, account.id],
  );
  const hasPriorHistory = accountInteractions.length > 0 || priorSessions.length > 0;

  const openIssues = useMemo(
    () => data.issues.filter((i) => i.accountId === account.id && i.status !== 'Resolved' && i.status !== 'Closed'),
    [data.issues, account.id],
  );
  const openOpportunities = useMemo(
    () => data.opportunities.filter((o) => o.accountId === account.id && o.stage !== 'Closed Won' && o.stage !== 'Closed Lost'),
    [data.opportunities, account.id],
  );
  const openCommitments = useMemo(
    () =>
      data.momSummaries
        .filter((m) => m.accountId === account.id)
        .flatMap((m) => m.actionItems.filter((a) => !a.done).map((a) => ({ ...a, momTitle: m.title }))),
    [data.momSummaries, account.id],
  );
  const previousFindings = priorSessions[0]?.keyFindings || accountInteractions[0]?.summary || '';

  const [form, setForm] = useState<FormState>(() => ({
    contactId: contacts.find((c) => c.isPrimary)?.id || contacts[0]?.id || null,
    interactionType: hasPriorHistory ? 'Repeat Interaction' : 'First Interaction',
    whatChangedSinceLast: '',
    experienceRating: null,
    dissatisfactionReasons: [],
    dissatisfactionDetails: '',
    awareOfCustomerCare: null,
    customerCareFeedback: '',
    businessGrowthPlans: '',
    expansionPotential: null,
    productNeedIdentified: null,
    productOpportunityNotes: '',
    interestedProducts: [],
    usingCompetitor: null,
    competitorNames: [],
    competitorNotes: '',
    advocacyStance: null,
    willingToBeReference: null,
    painPoints: [],
    stakeholders: contacts.map((c) => ({
      id: genId('dstk'),
      contactId: c.id,
      name: c.name,
      role: c.role,
      isNewStakeholder: false,
    })),
    contractAware: null,
    contractConcerns: '',
    keyFindings: '',
  }));

  const visibleSteps = useMemo(
    () => STEP_DEFS.filter((s) => s.id !== 'previous' || form.interactionType === 'Repeat Interaction'),
    [form.interactionType],
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const step = visibleSteps[Math.min(stepIndex, visibleSteps.length - 1)];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === visibleSteps.length - 1;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const canProceed = (): boolean => {
    switch (step.id) {
      case 'experience':
        return (
          form.experienceRating !== null &&
          (!isDissatisfiedRating(form.experienceRating) || form.dissatisfactionReasons.length > 0)
        );
      case 'care':
        return form.awareOfCustomerCare !== null;
      case 'product':
        return form.productNeedIdentified !== null;
      case 'competitor':
        return form.usingCompetitor !== null;
      case 'advocacy':
        return form.advocacyStance !== null;
      case 'contract':
        return form.contractAware !== null;
      default:
        return true;
    }
  };

  const goNext = () => setStepIndex((i) => Math.min(i + 1, visibleSteps.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const isDissatisfied = isDissatisfiedRating(form.experienceRating);

  const handleSave = () => {
    if (saving) return;
    setSaving(true);
    setTimeout(() => commitSave(), 400);
  };

  const commitSave = () => {
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const linkedIssueIds: string[] = [];
    const linkedOpportunityIds: string[] = [];
    const customer360FieldsUpdated: string[] = [];

    // 1. Auto create/update an Issue when the customer is unhappy.
    if (isDissatisfied) {
      const category = categoryForDissatisfactionReasons(form.dissatisfactionReasons);
      let targetIssue: Issue | null = null;
      for (const s of priorSessions) {
        if (s.linkedIssueIds.length === 0) continue;
        const cand = data.issues.find(
          (i) => s.linkedIssueIds.includes(i.id) && i.status !== 'Resolved' && i.status !== 'Closed',
        );
        if (cand) {
          targetIssue = cand;
          break;
        }
      }
      if (targetIssue) {
        updateIssue(targetIssue.id, {
          description: `${targetIssue.description}\n\nDiscovery follow-up (${formatDate(today)}): ${
            form.dissatisfactionDetails || 'Customer remains dissatisfied.'
          }`,
          updatedAt: today,
          priority: form.experienceRating === 'Very Dissatisfied' ? 'P1' : targetIssue.priority,
          healthImpact: form.experienceRating === 'Very Dissatisfied' ? 'red' : targetIssue.healthImpact,
        });
        linkedIssueIds.push(targetIssue.id);
      } else {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        const newIssue: Issue = {
          id: genId('iss'),
          accountId: account.id,
          title: `Customer dissatisfaction — ${form.dissatisfactionReasons[0] || 'General experience'}`,
          description: form.dissatisfactionDetails || 'Dissatisfaction identified during guided customer discovery.',
          status: 'Open',
          priority: form.experienceRating === 'Very Dissatisfied' ? 'P1' : 'P2',
          category,
          assignedTo: 'Account Team',
          createdAt: today,
          updatedAt: today,
          resolvedAt: null,
          dueDate: dueDate.toISOString().slice(0, 10),
          healthImpact: form.experienceRating === 'Very Dissatisfied' ? 'red' : 'amber',
        };
        addIssue(newIssue);
        linkedIssueIds.push(newIssue.id);
      }
    }

    // 2. Auto create/update an Opportunity when a product need is identified.
    if (form.productNeedIdentified) {
      let targetOpp: Opportunity | null = null;
      for (const s of priorSessions) {
        if (s.linkedOpportunityIds.length === 0) continue;
        const cand = data.opportunities.find(
          (o) => s.linkedOpportunityIds.includes(o.id) && o.stage !== 'Closed Won' && o.stage !== 'Closed Lost',
        );
        if (cand) {
          targetOpp = cand;
          break;
        }
      }
      if (targetOpp) {
        const mergedProducts = Array.from(new Set([...targetOpp.products, ...form.interestedProducts]));
        updateOpportunity(targetOpp.id, {
          products: mergedProducts,
          nextStep: form.productOpportunityNotes || targetOpp.nextStep,
          updatedAt: today,
        });
        linkedOpportunityIds.push(targetOpp.id);
      } else {
        const expectedClose = new Date();
        expectedClose.setDate(expectedClose.getDate() + 90);
        const newOpp: Opportunity = {
          id: genId('opp'),
          accountId: account.id,
          name: `Product interest — ${form.interestedProducts[0] || 'New need identified'}`,
          stage: 'Discovery',
          value: 0,
          probability: 20,
          expectedClose: expectedClose.toISOString().slice(0, 10),
          owner: account.relationshipManager,
          products: form.interestedProducts,
          createdAt: today,
          updatedAt: today,
          nextStep: form.productOpportunityNotes || 'Qualify the opportunity and estimate deal value.',
        };
        addOpportunity(newOpp);
        linkedOpportunityIds.push(newOpp.id);
      }
    }

    // 3. Update Customer 360 — current value updated, old value preserved in history (handled by the store).
    const c360 = data.customer360.find((c) => c.accountId === account.id);
    if (c360) {
      const updates: Partial<Customer360> = {};

      if (form.experienceRating) {
        const newScore = satisfactionScoreForRating(form.experienceRating);
        if (newScore !== c360.satisfactionScore) updates.satisfactionScore = newScore;
        const newTrend = engagementTrendForRating(form.experienceRating);
        if (newTrend !== c360.engagementTrend) updates.engagementTrend = newTrend;
      }

      if (form.advocacyStance) {
        const newNps = nudgeNpsForStance(c360.npsScore, form.advocacyStance);
        if (newNps !== c360.npsScore) updates.npsScore = newNps;
      }

      const riskCandidates = [...form.painPoints, ...(isDissatisfied && form.dissatisfactionDetails ? [form.dissatisfactionDetails] : [])];
      const newRisks = riskCandidates.filter(
        (r) => r.trim() && !c360.keyRisks.some((existing) => existing.toLowerCase() === r.trim().toLowerCase()),
      );
      if (newRisks.length > 0) updates.keyRisks = [...c360.keyRisks, ...newRisks];

      const growthPlan = form.businessGrowthPlans.trim();
      if (growthPlan && !c360.objectives.some((o) => o.toLowerCase() === growthPlan.toLowerCase())) {
        updates.objectives = [...c360.objectives, growthPlan];
      }

      if (Object.keys(updates).length > 0) {
        updateCustomer360(account.id, updates, account.relationshipManager, 'Guided Discovery');
        customer360FieldsUpdated.push(...Object.keys(updates));
      }
    }

    // 4. Persist the discovery session itself.
    const keyFindings =
      form.keyFindings.trim() ||
      buildDefaultKeyFindings({
        interactionType: form.interactionType,
        experienceRating: form.experienceRating,
        dissatisfactionDetails: form.dissatisfactionDetails,
        businessGrowthPlans: form.businessGrowthPlans,
        productOpportunityNotes: form.productOpportunityNotes,
        usingCompetitor: form.usingCompetitor,
        competitorNames: form.competitorNames,
        painPoints: form.painPoints,
        advocacyStance: form.advocacyStance,
      });

    const session: DiscoverySession = {
      id: genId('disc'),
      accountId: account.id,
      contactId: form.contactId,
      conductedBy: account.relationshipManager,
      date: now,
      interactionType: form.interactionType,
      whatChangedSinceLast: form.whatChangedSinceLast,
      experienceRating: form.experienceRating,
      isDissatisfied,
      dissatisfactionReasons: form.dissatisfactionReasons,
      dissatisfactionDetails: form.dissatisfactionDetails,
      awareOfCustomerCare: form.awareOfCustomerCare,
      customerCareFeedback: form.customerCareFeedback,
      businessGrowthPlans: form.businessGrowthPlans,
      expansionPotential: form.expansionPotential,
      productNeedIdentified: form.productNeedIdentified,
      productOpportunityNotes: form.productOpportunityNotes,
      interestedProducts: form.interestedProducts,
      usingCompetitor: form.usingCompetitor,
      competitorNames: form.competitorNames,
      competitorNotes: form.competitorNotes,
      advocacyStance: form.advocacyStance,
      willingToBeReference: form.willingToBeReference,
      painPoints: form.painPoints,
      stakeholders: form.stakeholders,
      contractAware: form.contractAware,
      contractConcerns: form.contractConcerns,
      keyFindings,
      linkedIssueIds,
      linkedOpportunityIds,
      customer360FieldsUpdated,
      createdAt: now,
    };
    addDiscoverySession(session);

    if (isDissatisfied || (form.usingCompetitor && form.competitorNames.length > 0)) {
      addAccountabilityEvent({
        id: genId('acc-evt'),
        accountId: account.id,
        type: 'Escalation',
        title: isDissatisfied ? 'Customer dissatisfaction identified in discovery' : 'Competitor threat identified in discovery',
        description: keyFindings,
        actor: account.relationshipManager,
        date: today,
        impact: form.experienceRating === 'Very Dissatisfied' ? 'High' : 'Medium',
      });
    }

    const notif: NotificationItem = {
      id: genId('not'),
      type: isDissatisfied ? 'Issue' : form.productNeedIdentified ? 'Opportunity' : 'System',
      title: `Guided discovery completed — ${account.name}`,
      message: keyFindings,
      accountId: account.id,
      createdAt: now,
      read: false,
      priority: isDissatisfied ? 'high' : 'medium',
    };
    addNotification(notif);

    toast.success(`Discovery session saved for ${account.name}.`);
    setSaving(false);
    onComplete(session);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-ink-900">Guided Customer Discovery</h2>
          <p className="text-sm text-ink-500 mt-0.5">
            {account.name} · Step {stepIndex + 1} of {visibleSteps.length}: {step.label}
          </p>
        </div>
        <Button
          onClick={() => {
            if (stepIndex > 0 && !window.confirm('Close this discovery session? Everything captured so far will be lost.')) return;
            onCancel();
          }}
        >
          <X className="h-4 w-4" /> Close
        </Button>
      </div>

      <ProgressBar value={((stepIndex + 1) / visibleSteps.length) * 100} showLabel />

      <Card>
        <CardBody className="space-y-5 min-h-[360px]">
          {step.id === 'type' && (
            <TypeStep
              form={form}
              update={update}
              hasPriorHistory={hasPriorHistory}
              accountInteractionsCount={accountInteractions.length}
              priorSessionsCount={priorSessions.length}
              contacts={contacts}
            />
          )}
          {step.id === 'previous' && (
            <PreviousContextStep
              form={form}
              update={update}
              previousFindings={previousFindings}
              openIssues={openIssues}
              openOpportunities={openOpportunities}
              openCommitments={openCommitments}
            />
          )}
          {step.id === 'experience' && <ExperienceStep form={form} update={update} isDissatisfied={isDissatisfied} />}
          {step.id === 'care' && <CareStep form={form} update={update} />}
          {step.id === 'growth' && <GrowthStep form={form} update={update} />}
          {step.id === 'product' && <ProductStep form={form} update={update} />}
          {step.id === 'competitor' && <CompetitorStep form={form} update={update} />}
          {step.id === 'advocacy' && <AdvocacyStep form={form} update={update} />}
          {step.id === 'painpoints' && <PainPointsStep form={form} update={update} />}
          {step.id === 'stakeholders' && <StakeholdersStep form={form} update={update} />}
          {step.id === 'contract' && <ContractStep form={form} update={update} account={account} />}
          {step.id === 'review' && (
            <ReviewStep
              form={form}
              update={update}
              account={account}
              isDissatisfied={isDissatisfied}
              defaultFindings={buildDefaultKeyFindings({
                interactionType: form.interactionType,
                experienceRating: form.experienceRating,
                dissatisfactionDetails: form.dissatisfactionDetails,
                businessGrowthPlans: form.businessGrowthPlans,
                productOpportunityNotes: form.productOpportunityNotes,
                usingCompetitor: form.usingCompetitor,
                competitorNames: form.competitorNames,
                painPoints: form.painPoints,
                advocacyStance: form.advocacyStance,
              })}
            />
          )}
        </CardBody>
      </Card>

      <div className="flex items-center justify-between">
        <Button onClick={goBack} disabled={isFirstStep}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {isLastStep ? (
          <Button variant="primary" onClick={handleSave} loading={saving}>
            <Check className="h-4 w-4" /> Save Discovery Session
          </Button>
        ) : (
          <Button variant="primary" onClick={goNext} disabled={!canProceed()}>
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface StepProps {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}

function TypeStep({
  form,
  update,
  hasPriorHistory,
  accountInteractionsCount,
  priorSessionsCount,
  contacts,
}: StepProps & {
  hasPriorHistory: boolean;
  accountInteractionsCount: number;
  priorSessionsCount: number;
  contacts: { id: string; name: string; role: string }[];
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-ink-900 mb-1">What kind of interaction is this?</h3>
        <p className="text-xs text-ink-500">
          {hasPriorHistory
            ? `We found ${accountInteractionsCount} prior interaction(s) and ${priorSessionsCount} discovery session(s) for this account.`
            : 'No prior interactions or discovery sessions found for this account.'}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(['First Interaction', 'Repeat Interaction'] as DiscoveryInteractionType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => update('interactionType', t)}
            className={`p-4 rounded-xl border-2 text-left transition ${
              form.interactionType === t ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-ink-300'
            }`}
          >
            <p className="text-sm font-semibold text-ink-900">{t}</p>
            <p className="text-xs text-ink-500 mt-1">
              {t === 'First Interaction'
                ? 'This is the first time we are engaging this customer.'
                : 'We have engaged this customer before — surface prior context.'}
            </p>
          </button>
        ))}
      </div>

      {contacts.length > 0 && (
        <div>
          <label className="text-sm font-medium text-ink-700 mb-2 block">Primary contact for this session</label>
          <select value={form.contactId || ''} onChange={(e) => update('contactId', e.target.value || null)} className="input">
            <option value="">Select contact</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.role}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function PreviousContextStep({
  form,
  update,
  previousFindings,
  openIssues,
  openOpportunities,
  openCommitments,
}: StepProps & {
  previousFindings: string;
  openIssues: Issue[];
  openOpportunities: Opportunity[];
  openCommitments: { id: string; task: string; owner: string; dueDate: string; done: boolean; momTitle: string }[];
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1.5">Previous Findings</p>
        <div className="p-3 rounded-lg bg-ink-50 border border-ink-100 text-sm text-ink-600">
          {previousFindings || 'No previous findings on record.'}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1.5">Previous Issues ({openIssues.length} open)</p>
        {openIssues.length === 0 ? (
          <p className="text-sm text-ink-400">No open issues.</p>
        ) : (
          <div className="space-y-1.5">
            {openIssues.map((i) => (
              <div key={i.id} className="flex items-center justify-between p-2.5 rounded-lg border border-ink-100 text-sm">
                <span className="text-ink-700">{i.title}</span>
                <Badge tone={i.priority === 'P1' ? 'red' : i.priority === 'P2' ? 'amber' : 'neutral'}>{i.priority}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1.5">
          Previous Opportunities ({openOpportunities.length} open)
        </p>
        {openOpportunities.length === 0 ? (
          <p className="text-sm text-ink-400">No open opportunities.</p>
        ) : (
          <div className="space-y-1.5">
            {openOpportunities.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-2.5 rounded-lg border border-ink-100 text-sm">
                <span className="text-ink-700">{o.name}</span>
                <span className="text-ink-500 text-xs">{o.stage} · {formatINR(o.value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1.5">
          Previous Commitments ({openCommitments.length} open)
        </p>
        {openCommitments.length === 0 ? (
          <p className="text-sm text-ink-400">No open commitments.</p>
        ) : (
          <div className="space-y-1.5">
            {openCommitments.map((c) => (
              <div key={c.id} className="p-2.5 rounded-lg border border-ink-100 text-sm">
                <p className="text-ink-700">{c.task}</p>
                <p className="text-xs text-ink-400 mt-0.5">{c.owner} · Due {formatDate(c.dueDate)} · from "{c.momTitle}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-ink-700 mb-1.5 block">What changed since the last interaction?</label>
        <textarea
          value={form.whatChangedSinceLast}
          onChange={(e) => update('whatChangedSinceLast', e.target.value)}
          placeholder="Note any changes in stakeholders, priorities, sentiment, or usage since last time..."
          rows={4}
          className="input resize-none"
        />
      </div>
    </div>
  );
}

function ExperienceStep({ form, update, isDissatisfied }: StepProps & { isDissatisfied: boolean }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-ink-900 mb-2">How does the customer feel about their overall experience?</h3>
        <div className="grid grid-cols-5 gap-2">
          {EXPERIENCE_RATINGS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => update('experienceRating', r)}
              className={`py-3 px-1 rounded-lg border-2 text-[11px] font-medium text-center transition ${
                form.experienceRating === r ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600 hover:border-ink-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {isDissatisfied && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-100 space-y-3">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-semibold">Customer is unhappy — capture the details</p>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-700 mb-1.5 block">What is driving the dissatisfaction?</label>
            <ChipMultiSelect
              options={DISSATISFACTION_REASONS}
              selected={form.dissatisfactionReasons}
              onToggle={(opt) =>
                update(
                  'dissatisfactionReasons',
                  form.dissatisfactionReasons.includes(opt)
                    ? form.dissatisfactionReasons.filter((r) => r !== opt)
                    : [...form.dissatisfactionReasons, opt],
                )
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-700 mb-1.5 block">Details</label>
            <textarea
              value={form.dissatisfactionDetails}
              onChange={(e) => update('dissatisfactionDetails', e.target.value)}
              placeholder="Describe the issue in the customer's words..."
              rows={3}
              className="input resize-none"
            />
          </div>
          <p className="text-xs text-red-600">Saving this session will automatically create or update an Issue for this account.</p>
        </div>
      )}
    </div>
  );
}

function CareStep({ form, update }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-ink-900 mb-2">Is the customer aware of how to reach customer care / support?</h3>
        <YesNo value={form.awareOfCustomerCare} onChange={(v) => update('awareOfCustomerCare', v)} />
      </div>
      <div>
        <label className="text-sm font-medium text-ink-700 mb-1.5 block">Feedback on support channels</label>
        <textarea
          value={form.customerCareFeedback}
          onChange={(e) => update('customerCareFeedback', e.target.value)}
          placeholder="Any comments on responsiveness, channels used, escalation paths..."
          rows={3}
          className="input resize-none"
        />
      </div>
    </div>
  );
}

function GrowthStep({ form, update }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-ink-700 mb-1.5 block">What are the customer's business growth plans?</label>
        <textarea
          value={form.businessGrowthPlans}
          onChange={(e) => update('businessGrowthPlans', e.target.value)}
          placeholder="Expansion plans, new markets, headcount growth, upcoming projects..."
          rows={4}
          className="input resize-none"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-ink-700 mb-2 block">Expansion potential</label>
        <div className="grid grid-cols-4 gap-2">
          {EXPANSION_LEVELS.map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => update('expansionPotential', lvl)}
              className={`py-2 rounded-lg border-2 text-xs font-medium transition ${
                form.expansionPotential === lvl ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600 hover:border-ink-300'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductStep({ form, update }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-ink-900 mb-2">Did the customer express a need for new products or services?</h3>
        <YesNo value={form.productNeedIdentified} onChange={(v) => update('productNeedIdentified', v)} />
      </div>
      {form.productNeedIdentified && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 space-y-3">
          <div>
            <label className="text-xs font-medium text-ink-700 mb-1.5 block">Which products are they interested in?</label>
            <ChipMultiSelect
              options={PRODUCT_CATALOG}
              selected={form.interestedProducts}
              onToggle={(opt) =>
                update(
                  'interestedProducts',
                  form.interestedProducts.includes(opt)
                    ? form.interestedProducts.filter((p) => p !== opt)
                    : [...form.interestedProducts, opt],
                )
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-700 mb-1.5 block">Notes</label>
            <textarea
              value={form.productOpportunityNotes}
              onChange={(e) => update('productOpportunityNotes', e.target.value)}
              placeholder="What problem would this solve? Who is the decision maker?"
              rows={3}
              className="input resize-none"
            />
          </div>
          <p className="text-xs text-emerald-700">Saving this session will automatically create or update an Opportunity for this account.</p>
        </div>
      )}
    </div>
  );
}

function CompetitorStep({ form, update }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-ink-900 mb-2">Is the customer evaluating or using a competitor?</h3>
        <YesNo value={form.usingCompetitor} onChange={(v) => update('usingCompetitor', v)} />
      </div>
      {form.usingCompetitor && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-ink-700 mb-1.5 block">Competitor name(s)</label>
            <TagInput
              values={form.competitorNames}
              onAdd={(v) => update('competitorNames', [...form.competitorNames, v])}
              onRemove={(v) => update('competitorNames', form.competitorNames.filter((c) => c !== v))}
              placeholder="e.g. Airtel Business"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-700 mb-1.5 block">Notes</label>
            <textarea
              value={form.competitorNotes}
              onChange={(e) => update('competitorNotes', e.target.value)}
              placeholder="What is the competitor offering? Pricing, relationship strength..."
              rows={3}
              className="input resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AdvocacyStep({ form, update }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-ink-900 mb-2">How would the customer advocate for us?</h3>
        <div className="grid grid-cols-3 gap-2">
          {ADVOCACY_STANCES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => update('advocacyStance', s)}
              className={`py-2.5 rounded-lg border-2 text-sm font-medium transition ${
                form.advocacyStance === s ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600 hover:border-ink-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-ink-900 mb-2">Would they be willing to serve as a reference?</h3>
        <YesNo value={form.willingToBeReference} onChange={(v) => update('willingToBeReference', v)} />
      </div>
    </div>
  );
}

function PainPointsStep({ form, update }: StepProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-ink-900 mb-2">Capture any pain points mentioned</h3>
      <TagInput
        values={form.painPoints}
        onAdd={(v) => update('painPoints', [...form.painPoints, v])}
        onRemove={(v) => update('painPoints', form.painPoints.filter((p) => p !== v))}
        placeholder="e.g. Invoice format is hard to reconcile"
      />
    </div>
  );
}

function StakeholdersStep({ form, update }: StepProps) {
  const addStakeholder = () => {
    update('stakeholders', [
      ...form.stakeholders,
      { id: genId('dstk'), contactId: null, name: '', role: '', isNewStakeholder: true },
    ]);
  };
  const removeStakeholder = (id: string) => {
    update('stakeholders', form.stakeholders.filter((s) => s.id !== id));
  };
  const patchStakeholder = (id: string, patch: Partial<DiscoveryStakeholder>) => {
    update('stakeholders', form.stakeholders.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-900">Who was involved or mentioned?</h3>
        <Button size="sm" onClick={addStakeholder}>
          <Plus className="h-3.5 w-3.5" /> Add Stakeholder
        </Button>
      </div>
      {form.stakeholders.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="No stakeholders yet" message="Add anyone relevant to this account's decision-making." />
      ) : (
        <div className="space-y-2">
          {form.stakeholders.map((s) => (
            <div key={s.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-ink-100">
              <input
                type="text"
                value={s.name}
                onChange={(e) => patchStakeholder(s.id, { name: e.target.value })}
                placeholder="Name"
                className="input flex-1"
              />
              <input
                type="text"
                value={s.role}
                onChange={(e) => patchStakeholder(s.id, { role: e.target.value })}
                placeholder="Role"
                className="input flex-1"
              />
              {s.isNewStakeholder && <Badge tone="blue">New</Badge>}
              <button type="button" onClick={() => removeStakeholder(s.id)} className="p-2 -m-2 rounded-lg text-ink-400 hover:text-red-600 hover:bg-red-50 shrink-0 transition" aria-label="Remove stakeholder">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContractStep({ form, update, account }: StepProps & { account: Account }) {
  const daysLeft = daysUntil(account.contractRenewal);
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-ink-50 border border-ink-100 text-sm">
        <p className="text-ink-700">
          Contract runs from <strong>{formatDate(account.contractStart)}</strong> to{' '}
          <strong>{formatDate(account.contractRenewal)}</strong>.
        </p>
        <p className="text-ink-500 text-xs mt-1">{daysLeft > 0 ? `${daysLeft} days until renewal.` : 'Contract renewal is overdue.'}</p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-ink-900 mb-2">Is the customer aware of their contract terms and renewal date?</h3>
        <YesNo value={form.contractAware} onChange={(v) => update('contractAware', v)} />
      </div>
      <div>
        <label className="text-sm font-medium text-ink-700 mb-1.5 block">Contract-related concerns</label>
        <textarea
          value={form.contractConcerns}
          onChange={(e) => update('contractConcerns', e.target.value)}
          placeholder="Pricing concerns, terms they want renegotiated, renewal risk..."
          rows={3}
          className="input resize-none"
        />
      </div>
    </div>
  );
}

function ReviewStep({
  form,
  update,
  account,
  isDissatisfied,
  defaultFindings,
}: StepProps & { account: Account; isDissatisfied: boolean; defaultFindings: string }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-ink-700 mb-1.5 block">Key findings summary</label>
        <textarea
          value={form.keyFindings}
          onChange={(e) => update('keyFindings', e.target.value)}
          placeholder={defaultFindings || 'Summarize the key findings from this discovery session...'}
          rows={5}
          className="input resize-none"
        />
        {!form.keyFindings.trim() && defaultFindings && (
          <p className="text-xs text-ink-400 mt-1">Leave blank to auto-generate from your answers above.</p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">This session will automatically:</p>
        {isDissatisfied && (
          <div className="flex items-center gap-2 text-sm text-red-700 p-2.5 rounded-lg bg-red-50 border border-red-100">
            <AlertTriangle className="h-4 w-4 shrink-0" /> Create or update an Issue for {account.name}
          </div>
        )}
        {form.productNeedIdentified && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
            <TrendingUp className="h-4 w-4 shrink-0" /> Create or update an Opportunity for {account.name}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-brand-700 p-2.5 rounded-lg bg-brand-50 border border-brand-100">
          <FileText className="h-4 w-4 shrink-0" /> Update Customer 360 (current value updated, prior value kept in history)
        </div>
        {!isDissatisfied && !form.productNeedIdentified && (
          <p className="text-xs text-ink-400">No automatic Issue or Opportunity will be created for this session.</p>
        )}
      </div>
    </div>
  );
}
