import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { HealthBadge } from '@/components/ui/HealthBadge';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AccountAvatar, Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatINR, formatDate, daysUntil, relativeTime } from '@/utils/format';
import type { AccountHealth } from '@/types/models';
import {
  ArrowLeft,
  Mail,
  Phone,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Calendar,
  ShieldCheck,
  FileText,
  FileEdit,
  Building2,
  Users,
  IndianRupee,
  Save,
} from 'lucide-react';

interface AccountDetailPageProps {
  accountId: string;
  onNavigate: (path: string) => void;
}

type Tab = 'overview' | 'interactions' | 'issues' | 'opportunities' | 'calendar' | 'accountability' | 'mom';

export function AccountDetailPage({ accountId, onNavigate }: AccountDetailPageProps) {
  const { data, updateAccount } = useStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [editHealth, setEditHealth] = useState<AccountHealth>('green');
  const [editArr, setEditArr] = useState('');

  const account = data.accounts.find((a) => a.id === accountId);
  if (!account) {
    return (
      <Card>
        <EmptyState icon={<Building2 className="h-7 w-7" />} title="Account not found" message="This account may have been removed." action={<Button onClick={() => onNavigate('/accounts')}>Back to Accounts</Button>} />
      </Card>
    );
  }

  const contacts = data.contacts.filter((c) => c.accountId === accountId);
  const c360 = data.customer360.find((c) => c.accountId === accountId);
  const interactions = data.interactions.filter((i) => i.accountId === accountId);
  const issues = data.issues.filter((i) => i.accountId === accountId);
  const opportunities = data.opportunities.filter((o) => o.accountId === accountId);
  const calendar = data.calendar.filter((c) => c.accountId === accountId);
  const events = data.accountabilityEvents.filter((e) => e.accountId === accountId);
  const moms = data.momSummaries.filter((m) => m.accountId === accountId);
  const updateReqs = data.updateRequests.filter((u) => u.accountId === accountId);

  const openEdit = () => {
    setEditHealth(account.health);
    setEditArr(String(account.arr));
    setEditOpen(true);
  };

  const saveEdit = () => {
    updateAccount(accountId, {
      health: editHealth,
      arr: Number(editArr) || account.arr,
    });
    setEditOpen(false);
  };

  const tabs: { id: Tab; label: string; icon: typeof MessageSquare; count: number }[] = [
    { id: 'overview', label: 'Overview', icon: Building2, count: 0 },
    { id: 'interactions', label: 'Interactions', icon: MessageSquare, count: interactions.length },
    { id: 'issues', label: 'Issues', icon: AlertTriangle, count: issues.length },
    { id: 'opportunities', label: 'Opportunities', icon: TrendingUp, count: opportunities.length },
    { id: 'calendar', label: 'Calendar', icon: Calendar, count: calendar.length },
    { id: 'accountability', label: 'Accountability', icon: ShieldCheck, count: events.length },
    { id: 'mom', label: 'MOM', icon: FileText, count: moms.length },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <button onClick={() => onNavigate('/accounts')} className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700 transition mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Accounts
        </button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <AccountAvatar name={account.name} gradient={account.logoColor} size="lg" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl font-bold text-ink-900">{account.name}</h1>
                <HealthBadge health={account.health} />
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge tone="neutral">{account.industry}</Badge>
                <Badge tone="brand">{account.segment}</Badge>
                <Badge tone="gray">{account.hqCity}</Badge>
              </div>
            </div>
          </div>
          <Button variant="primary" onClick={openEdit}>
            <FileEdit className="h-4 w-4" /> Edit Account
          </Button>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-ink-400 mb-1">
            <IndianRupee className="h-4 w-4" />
            <span className="text-xs font-medium">ARR</span>
          </div>
          <p className="font-display text-xl font-bold text-ink-900">{formatINR(account.arr)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-ink-400 mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium">Contacts</span>
          </div>
          <p className="font-display text-xl font-bold text-ink-900">{contacts.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-ink-400 mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Open Issues</span>
          </div>
          <p className={`font-display text-xl font-bold ${account.openIssues > 2 ? 'text-red-600' : account.openIssues > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {issues.filter((i) => i.status !== 'Resolved' && i.status !== 'Closed').length}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-ink-400 mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium">Renewal</span>
          </div>
          <p className="font-display text-xl font-bold text-ink-900">{formatDate(account.contractRenewal)}</p>
          <p className="text-xs text-ink-400 mt-0.5">{daysUntil(account.contractRenewal)} days left</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-ink-200 overflow-x-auto pb-px">
        {tabs.map((t) => {
          const isActive = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                isActive ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {t.count > 0 && <span className={`chip px-1.5 py-0 text-[10px] ${isActive ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500'}`}>{t.count}</span>}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer 360 */}
          <div className="lg:col-span-2 space-y-6">
            {c360 && (
              <Card>
                <CardHeader>
                  <CardTitle>Customer 360 Profile</CardTitle>
                </CardHeader>
                <CardBody className="space-y-5">
                  <p className="text-sm text-ink-600 leading-relaxed">{c360.overview}</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-ink-400 font-medium uppercase tracking-wide mb-2">Satisfaction Score</p>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={c360.satisfactionScore} tone={c360.satisfactionScore >= 75 ? 'green' : c360.satisfactionScore >= 50 ? 'amber' : 'red'} />
                        <span className="text-sm font-semibold text-ink-900">{c360.satisfactionScore}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-ink-400 font-medium uppercase tracking-wide mb-2">NPS Score</p>
                      <p className={`font-display text-xl font-bold ${c360.npsScore >= 50 ? 'text-emerald-600' : c360.npsScore >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                        {c360.npsScore > 0 ? '+' : ''}{c360.npsScore}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-ink-400 font-medium uppercase tracking-wide mb-2">Objectives</p>
                    <ul className="space-y-1.5">
                      {c360.objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-ink-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs text-ink-400 font-medium uppercase tracking-wide mb-2">Products Used</p>
                    <div className="flex flex-wrap gap-2">
                      {c360.productsUsed.map((p, i) => (
                        <Badge key={i} tone="blue">{p}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-ink-400 font-medium uppercase tracking-wide mb-2">Key Risks</p>
                    <ul className="space-y-1.5">
                      {c360.keyRisks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-red-600">
                          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs text-ink-400 font-medium uppercase tracking-wide mb-2">Revenue Trend</p>
                    <div className="flex items-end gap-2 h-24">
                      {c360.revenueHistory.map((r, i) => {
                        const max = Math.max(...c360.revenueHistory.map((x) => x.value));
                        const h = (r.value / max) * 100;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full bg-brand-100 rounded-t-md flex items-end" style={{ height: '100%' }}>
                              <div className="w-full bg-brand-500 rounded-t-md transition-all duration-500" style={{ height: `${h}%` }} />
                            </div>
                            <span className="text-[10px] text-ink-400">{r.quarter.split(' ')[0]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Contacts sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Contacts</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                {contacts.length === 0 ? (
                  <p className="text-sm text-ink-400 py-2 text-center">No contacts</p>
                ) : (
                  contacts.map((c) => (
                    <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg border border-ink-100">
                      <Avatar name={c.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-ink-900 truncate">{c.name}</p>
                          {c.isPrimary && <Badge tone="brand" className="text-[10px] px-1.5 py-0">Primary</Badge>}
                        </div>
                        <p className="text-xs text-ink-400 mt-0.5">{c.role}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-[11px] text-ink-500 hover:text-brand-600 transition">
                            <Mail className="h-3 w-3" /> Email
                          </a>
                          <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-[11px] text-ink-500 hover:text-brand-600 transition">
                            <Phone className="h-3 w-3" /> Call
                          </a>
                        </div>
                        <Badge tone="neutral" className="mt-2 text-[10px]">{c.influence}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>

            {updateReqs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Update Requests</CardTitle>
                </CardHeader>
                <CardBody className="space-y-2">
                  {updateReqs.map((r) => (
                    <div key={r.id} className="p-3 rounded-lg border border-ink-100">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-ink-900">{r.field}</p>
                        <Badge tone={r.status === 'Approved' ? 'green' : r.status === 'Rejected' ? 'red' : r.status === 'Action Required' ? 'amber' : 'neutral'}>
                          {r.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-ink-400 mt-1">{r.currentValue} → {r.requestedValue}</p>
                    </div>
                  ))}
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === 'interactions' && (
        <Card>
          <CardBody className="space-y-3">
            {interactions.length === 0 ? (
              <EmptyState icon={<MessageSquare className="h-7 w-7" />} title="No interactions" message="No interactions logged for this account." />
            ) : (
              interactions.map((int) => (
                <div key={int.id} className="flex items-start gap-3 p-4 rounded-lg border border-ink-100">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${int.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-600' : int.sentiment === 'negative' ? 'bg-red-50 text-red-600' : 'bg-ink-100 text-ink-500'}`}>
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-ink-900">{int.subject}</p>
                      <Badge tone="neutral">{int.channel}</Badge>
                    </div>
                    <p className="text-sm text-ink-500 mt-1">{int.summary}</p>
                    <p className="text-xs text-ink-400 mt-2">{int.owner} · {int.direction} · {relativeTime(int.date)}{int.durationMins > 0 ? ` · ${int.durationMins}m` : ''}</p>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'issues' && (
        <Card>
          <CardBody className="space-y-3">
            {issues.length === 0 ? (
              <EmptyState icon={<AlertTriangle className="h-7 w-7" />} title="No issues" message="No issues reported for this account." />
            ) : (
              issues.map((iss) => (
                <div key={iss.id} className="flex items-start gap-3 p-4 rounded-lg border border-ink-100">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-red-50 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-ink-900">{iss.title}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge tone={iss.priority === 'P1' ? 'red' : iss.priority === 'P2' ? 'amber' : 'neutral'}>{iss.priority}</Badge>
                        <Badge tone={iss.status === 'Escalated' ? 'red' : iss.status === 'Resolved' || iss.status === 'Closed' ? 'green' : iss.status === 'In Progress' ? 'amber' : 'neutral'}>
                          {iss.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-ink-500 mt-1">{iss.description}</p>
                    <p className="text-xs text-ink-400 mt-2">{iss.category} · Assigned to {iss.assignedTo} · Due {formatDate(iss.dueDate)}</p>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'opportunities' && (
        <Card>
          <CardBody className="space-y-3">
            {opportunities.length === 0 ? (
              <EmptyState icon={<TrendingUp className="h-7 w-7" />} title="No opportunities" message="No opportunities for this account." />
            ) : (
              opportunities.map((opp) => (
                <div key={opp.id} className="flex items-start gap-3 p-4 rounded-lg border border-ink-100">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-ink-900">{opp.name}</p>
                      <Badge tone={opp.stage === 'Closed Won' ? 'green' : opp.stage === 'Closed Lost' ? 'red' : opp.stage === 'Negotiation' ? 'amber' : 'brand'}>
                        {opp.stage}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm font-semibold text-ink-900">{formatINR(opp.value)}</span>
                      <div className="flex-1 max-w-[200px]">
                        <ProgressBar value={opp.probability} tone={opp.probability >= 60 ? 'green' : opp.probability >= 30 ? 'amber' : 'red'} showLabel />
                      </div>
                    </div>
                    <p className="text-xs text-ink-400 mt-2">Close by {formatDate(opp.expectedClose)} · {opp.nextStep}</p>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'calendar' && (
        <Card>
          <CardBody className="space-y-3">
            {calendar.length === 0 ? (
              <EmptyState icon={<Calendar className="h-7 w-7" />} title="No calendar events" message="No scheduled meetings for this account." />
            ) : (
              calendar.map((cal) => (
                <div key={cal.id} className="flex items-start gap-3 p-4 rounded-lg border border-ink-100">
                  <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg bg-brand-50 text-brand-700 shrink-0">
                    <span className="text-xs font-medium">{new Date(cal.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                    <span className="text-lg font-display font-bold leading-none">{new Date(cal.date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-ink-900">{cal.title}</p>
                      <Badge tone={cal.status === 'Completed' ? 'green' : cal.status === 'Cancelled' ? 'red' : 'brand'}>{cal.status}</Badge>
                    </div>
                    <p className="text-xs text-ink-400 mt-1">{cal.type} · {cal.time} · {cal.durationMins}m · {cal.location}</p>
                    <p className="text-xs text-ink-400 mt-1">Attendees: {cal.attendees.join(', ')}</p>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'accountability' && (
        <Card>
          <CardBody className="space-y-3">
            {events.length === 0 ? (
              <EmptyState icon={<ShieldCheck className="h-7 w-7" />} title="No events" message="No accountability events for this account." />
            ) : (
              events.map((evt) => (
                <div key={evt.id} className="flex items-start gap-3 p-4 rounded-lg border border-ink-100">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-brand-50 text-brand-600">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-ink-900">{evt.title}</p>
                      <Badge tone={evt.impact === 'High' ? 'red' : evt.impact === 'Medium' ? 'amber' : 'neutral'}>{evt.impact}</Badge>
                    </div>
                    <p className="text-sm text-ink-500 mt-1">{evt.description}</p>
                    <p className="text-xs text-ink-400 mt-2">{evt.type} · {evt.actor} · {formatDate(evt.date)}</p>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'mom' && (
        <Card>
          <CardBody className="space-y-3">
            {moms.length === 0 ? (
              <EmptyState icon={<FileText className="h-7 w-7" />} title="No MOM summaries" message="No minutes of meetings for this account." />
            ) : (
              moms.map((mom) => (
                <div key={mom.id} className="p-4 rounded-lg border border-ink-100">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink-900">{mom.title}</p>
                    <Badge tone="neutral">{formatDate(mom.meetingDate)}</Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-ink-500 uppercase tracking-wide">Agenda</p>
                      <ul className="mt-1 space-y-0.5">
                        {mom.agenda.map((a, i) => (
                          <li key={i} className="text-sm text-ink-600 flex items-start gap-2">
                            <span className="text-ink-300">•</span> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-ink-500 uppercase tracking-wide">Decisions</p>
                      <ul className="mt-1 space-y-0.5">
                        {mom.decisions.map((d, i) => (
                          <li key={i} className="text-sm text-ink-600 flex items-start gap-2">
                            <span className="text-emerald-500">✓</span> {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-ink-500 uppercase tracking-wide">Action Items</p>
                      <ul className="mt-1 space-y-0.5">
                        {mom.actionItems.map((a) => (
                          <li key={a.id} className="text-sm flex items-start gap-2">
                            <span className={a.done ? 'text-emerald-500' : 'text-ink-300'}>{a.done ? '✓' : '○'}</span>
                            <span className={a.done ? 'text-ink-400 line-through' : 'text-ink-600'}>{a.task}</span>
                            <span className="text-xs text-ink-400 ml-1">— {a.owner} · {formatDate(a.dueDate)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      )}

      {/* Edit modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit ${account.name}`}
        footer={
          <>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveEdit}>
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink-700 mb-2 block">Account Health</label>
            <div className="grid grid-cols-3 gap-2">
              {(['green', 'amber', 'red'] as const).map((h) => (
                <button
                  key={h}
                  onClick={() => setEditHealth(h)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition ${editHealth === h ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-ink-300'}`}
                >
                  <HealthBadge health={h} size="sm" showLabel />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-ink-700 mb-2 block">ARR (in ₹ Lakhs)</label>
            <input
              type="number"
              value={editArr}
              onChange={(e) => setEditArr(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
