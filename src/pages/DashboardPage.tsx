import { useStore } from '@/store/StoreContext';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { HealthBadge, HealthDot } from '@/components/ui/HealthBadge';
import { Badge } from '@/components/ui/Badge';
import { AccountAvatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatINR, formatDate, daysUntil, relativeTime } from '@/utils/format';
import { openIssueCount } from '@/utils/accountStats';
import { DemoGuide } from '@/components/demo/DemoGuide';
import {
  Building2,
  AlertTriangle,
  TrendingUp,
  IndianRupee,
  ArrowRight,
  Calendar,
  Bell,
  ShieldCheck,
} from 'lucide-react';
import type { AccountHealth } from '@/types/models';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { data, viewMode } = useStore();

  const totalAccounts = data.accounts.length;
  const totalArr = data.accounts.reduce((sum, a) => sum + a.arr, 0);
  const openIssues = data.issues.filter((i) => i.status === 'Open' || i.status === 'Escalated' || i.status === 'In Progress').length;
  const openOpps = data.opportunities.filter((o) => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost').length;
  const pipelineValue = data.opportunities
    .filter((o) => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost')
    .reduce((sum, o) => sum + o.value * (o.probability / 100), 0);

  const healthCounts: Record<AccountHealth, number> = { green: 0, amber: 0, red: 0 };
  data.accounts.forEach((a) => healthCounts[a.health]++);

  const redAccounts = data.accounts.filter((a) => a.health === 'red');
  const upcomingRenewals = [...data.accounts]
    .filter((a) => {
      const days = daysUntil(a.contractRenewal);
      return days >= 0 && days <= 180;
    })
    .sort((a, b) => new Date(a.contractRenewal).getTime() - new Date(b.contractRenewal).getTime())
    .slice(0, 5);

  const recentInteractions = [...data.interactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const upcomingCalendar = [...data.calendar]
    .filter((c) => c.status === 'Scheduled' && daysUntil(c.date) >= 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const recentEvents = [...data.accountabilityEvents]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Dashboard"
        subtitle="Overview of your business relationships"
        icon={<Building2 className="h-5 w-5" />}
      />

      <DemoGuide onNavigate={onNavigate} />

      {/* Stats */}
      <div className={`grid grid-cols-1 gap-4 ${viewMode === 'mobile' ? '' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
        <StatCard label="Total Accounts" value={totalAccounts} icon={<Building2 className="h-5 w-5" />} tone="brand" subtext={`${data.contacts.length} contacts`} />
        <StatCard label="Annual Recurring Revenue" value={formatINR(totalArr)} icon={<IndianRupee className="h-5 w-5" />} tone="green" subtext="across all accounts" />
        <StatCard label="Open Issues" value={openIssues} icon={<AlertTriangle className="h-5 w-5" />} tone="red" subtext={`${data.issues.filter((i) => i.priority === 'P1' && i.status !== 'Resolved' && i.status !== 'Closed').length} P1 critical`} />
        <StatCard label="Pipeline Value" value={formatINR(pipelineValue)} icon={<TrendingUp className="h-5 w-5" />} tone="blue" subtext={`${openOpps} open opportunities`} />
      </div>

      {/* Health overview */}
      <Card>
        <CardHeader>
          <CardTitle>Account Health Overview</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2">
                <HealthDot health="green" />
                <span className="text-2xl font-display font-bold text-emerald-700">{healthCounts.green}</span>
              </div>
              <p className="text-xs text-emerald-600 mt-1 font-medium">Healthy</p>
              <div className="w-full mt-3">
                <ProgressBar value={(healthCounts.green / totalAccounts) * 100} tone="green" />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2">
                <HealthDot health="amber" />
                <span className="text-2xl font-display font-bold text-amber-700">{healthCounts.amber}</span>
              </div>
              <p className="text-xs text-amber-600 mt-1 font-medium">At Risk</p>
              <div className="w-full mt-3">
                <ProgressBar value={(healthCounts.amber / totalAccounts) * 100} tone="amber" />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-center gap-2">
                <HealthDot health="red" />
                <span className="text-2xl font-display font-bold text-red-700">{healthCounts.red}</span>
              </div>
              <p className="text-xs text-red-600 mt-1 font-medium">Critical</p>
              <div className="w-full mt-3">
                <ProgressBar value={(healthCounts.red / totalAccounts) * 100} tone="red" />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className={`grid grid-cols-1 gap-6 ${viewMode === 'mobile' ? '' : 'lg:grid-cols-2'}`}>
        {/* Critical accounts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Critical Accounts</CardTitle>
              <button onClick={() => onNavigate('/accounts')} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {redAccounts.length === 0 ? (
              <p className="text-sm text-ink-400 py-4 text-center">No critical accounts</p>
            ) : (
              redAccounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => onNavigate(`/accounts/${acc.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-ink-100 hover:bg-ink-50 transition text-left"
                >
                  <AccountAvatar name={acc.name} gradient={acc.logoColor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{acc.name}</p>
                    <p className="text-xs text-ink-400">{openIssueCount(data, acc.id)} open issues · {formatINR(acc.arr)}</p>
                  </div>
                  <HealthBadge health={acc.health} size="sm" />
                </button>
              ))
            )}
          </CardBody>
        </Card>

        {/* Upcoming renewals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Renewals</CardTitle>
              <Calendar className="h-4 w-4 text-ink-400" />
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {upcomingRenewals.length === 0 ? (
              <p className="text-sm text-ink-400 py-4 text-center">No renewals in the next 180 days</p>
            ) : upcomingRenewals.map((acc) => {
              const days = daysUntil(acc.contractRenewal);
              return (
                <button
                  key={acc.id}
                  onClick={() => onNavigate(`/accounts/${acc.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-ink-100 hover:bg-ink-50 transition text-left"
                >
                  <AccountAvatar name={acc.name} gradient={acc.logoColor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{acc.name}</p>
                    <p className="text-xs text-ink-400">{formatDate(acc.contractRenewal)}</p>
                  </div>
                  <Badge tone={days < 60 ? 'red' : days < 120 ? 'amber' : 'neutral'}>
                    {days} days
                  </Badge>
                </button>
              );
            })}
          </CardBody>
        </Card>

        {/* Recent interactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Interactions</CardTitle>
              <button onClick={() => onNavigate('/interactions')} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {recentInteractions.length === 0 ? (
              <p className="text-sm text-ink-400 py-4 text-center">No interactions logged yet</p>
            ) : recentInteractions.map((int) => {
              const acc = data.accounts.find((a) => a.id === int.accountId);
              return (
                <button
                  key={int.id}
                  onClick={() => onNavigate(`/accounts/${int.accountId}`)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg border border-ink-100 hover:bg-ink-50 transition text-left"
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${int.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-600' : int.sentiment === 'negative' ? 'bg-red-50 text-red-600' : 'bg-ink-100 text-ink-500'}`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{int.subject}</p>
                    <p className="text-xs text-ink-400">{acc?.name} · {int.channel} · {relativeTime(int.date)}</p>
                  </div>
                </button>
              );
            })}
          </CardBody>
        </Card>

        {/* Recent accountability events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Accountability Events</CardTitle>
              <button onClick={() => onNavigate('/accountability')} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {recentEvents.length === 0 ? (
              <p className="text-sm text-ink-400 py-4 text-center">No accountability events yet</p>
            ) : recentEvents.map((evt) => {
              const acc = data.accounts.find((a) => a.id === evt.accountId);
              return (
                <div key={evt.id} className="flex items-start gap-3 p-3 rounded-lg border border-ink-100">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-brand-50 text-brand-600">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{evt.title}</p>
                    <p className="text-xs text-ink-400">{acc?.name} · {formatDate(evt.date)}</p>
                  </div>
                  <Badge tone={evt.impact === 'High' ? 'red' : evt.impact === 'Medium' ? 'amber' : 'neutral'}>
                    {evt.impact}
                  </Badge>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      {/* Upcoming calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Upcoming Meetings</CardTitle>
            <button onClick={() => onNavigate('/calendar')} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View calendar <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-2">
            {upcomingCalendar.length === 0 ? (
              <p className="text-sm text-ink-400 py-4 text-center">No upcoming meetings scheduled</p>
            ) : upcomingCalendar.map((cal) => {
              const acc = data.accounts.find((a) => a.id === cal.accountId);
              const days = daysUntil(cal.date);
              return (
                <button
                  key={cal.id}
                  onClick={() => onNavigate(`/accounts/${cal.accountId}`)}
                  className="w-full flex items-center gap-4 p-3 rounded-lg border border-ink-100 hover:bg-ink-50 transition text-left"
                >
                  <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg bg-brand-50 text-brand-700 shrink-0">
                    <span className="text-xs font-medium">{new Date(cal.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                    <span className="text-lg font-display font-bold leading-none">{new Date(cal.date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{cal.title}</p>
                    <p className="text-xs text-ink-400">{acc?.name} · {cal.time} · {cal.location}</p>
                  </div>
                  <Badge tone={days <= 1 ? 'red' : days <= 7 ? 'amber' : 'neutral'}>
                    {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                  </Badge>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
