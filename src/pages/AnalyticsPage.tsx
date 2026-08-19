import { useStore } from '@/store/StoreContext';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { HealthDot } from '@/components/ui/HealthBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AccountAvatar } from '@/components/ui/Avatar';
import { formatINR, formatDate, daysUntil } from '@/utils/format';
import { BarChart3, TrendingUp, AlertTriangle, Users, IndianRupee, Building2 } from 'lucide-react';
import type { AccountHealth, OpportunityStage, IssueCategory, InteractionChannel } from '@/types/models';

interface AnalyticsPageProps {
  onNavigate: (path: string) => void;
}

export function AnalyticsPage({ onNavigate }: AnalyticsPageProps) {
  const { data } = useStore();

  const totalArr = data.accounts.reduce((s, a) => s + a.arr, 0);
  const totalAccounts = data.accounts.length;
  const openIssues = data.issues.filter((i) => i.status !== 'Resolved' && i.status !== 'Closed');
  const openOpps = data.opportunities.filter((o) => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost');
  const pipelineValue = openOpps.reduce((s, o) => s + o.value, 0);
  const weightedPipeline = openOpps.reduce((s, o) => s + o.value * (o.probability / 100), 0);

  // Health distribution
  const healthCounts: Record<AccountHealth, number> = { green: 0, amber: 0, red: 0 };
  data.accounts.forEach((a) => healthCounts[a.health]++);

  // Segment distribution
  const segments = ['Strategic', 'Enterprise', 'Mid-Market', 'SMB'] as const;
  const segmentData = segments.map((seg) => ({
    segment: seg,
    count: data.accounts.filter((a) => a.segment === seg).length,
    arr: data.accounts.filter((a) => a.segment === seg).reduce((s, a) => s + a.arr, 0),
  }));

  // Industry distribution
  const industryMap: Record<string, number> = {};
  data.accounts.forEach((a) => {
    industryMap[a.industry] = (industryMap[a.industry] || 0) + 1;
  });
  const industries = Object.entries(industryMap).sort((a, b) => b[1] - a[1]);

  // Opportunity by stage
  const stages: OpportunityStage[] = ['Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  const stageData = stages.map((stage) => {
    const opps = data.opportunities.filter((o) => o.stage === stage);
    return { stage, count: opps.length, value: opps.reduce((s, o) => s + o.value, 0) };
  });

  // Issues by category
  const issueCategories: IssueCategory[] = ['Network', 'Billing', 'Service', 'Technical', 'Contract', 'Product'];
  const issueCategoryData = issueCategories.map((cat) => ({
    category: cat,
    count: data.issues.filter((i) => i.category === cat).length,
  }));

  // Issues by priority
  const priorities = ['P1', 'P2', 'P3', 'P4'] as const;
  const priorityData = priorities.map((p) => ({
    priority: p,
    count: data.issues.filter((i) => i.priority === p && i.status !== 'Resolved' && i.status !== 'Closed').length,
  }));

  // Interactions by channel
  const channels: InteractionChannel[] = ['Call', 'Email', 'Meeting', 'Site Visit', 'Digital', 'Conference'];
  const channelData = channels.map((ch) => ({
    channel: ch,
    count: data.interactions.filter((i) => i.channel === ch).length,
  }));

  // Interaction sentiment
  const sentimentData = {
    positive: data.interactions.filter((i) => i.sentiment === 'positive').length,
    neutral: data.interactions.filter((i) => i.sentiment === 'neutral').length,
    negative: data.interactions.filter((i) => i.sentiment === 'negative').length,
  };

  // Top accounts by ARR
  const topAccounts = [...data.accounts].sort((a, b) => b.arr - a.arr).slice(0, 5);

  // Renewals within 90 days
  const upcomingRenewals = [...data.accounts]
    .filter((a) => daysUntil(a.contractRenewal) <= 90)
    .sort((a, b) => new Date(a.contractRenewal).getTime() - new Date(b.contractRenewal).getTime());

  // RM workload
  const rmMap: Record<string, { accounts: number; arr: number; issues: number }> = {};
  data.accounts.forEach((a) => {
    if (!rmMap[a.relationshipManager]) rmMap[a.relationshipManager] = { accounts: 0, arr: 0, issues: 0 };
    rmMap[a.relationshipManager].accounts++;
    rmMap[a.relationshipManager].arr += a.arr;
    rmMap[a.relationshipManager].issues += a.openIssues;
  });
  const rmData = Object.entries(rmMap).sort((a, b) => b[1].arr - a[1].arr);

  const maxChannel = Math.max(...channelData.map((c) => c.count), 1);
  const maxIndustry = Math.max(...industries.map(([, c]) => c), 1);
  const maxSegmentArr = Math.max(...segmentData.map((s) => s.arr), 1);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Analytics"
        subtitle="Portfolio insights and performance metrics"
        icon={<BarChart3 className="h-5 w-5" />}
      />

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-ink-400 mb-1">
            <IndianRupee className="h-4 w-4" />
            <span className="text-xs font-medium">Total ARR</span>
          </div>
          <p className="font-display text-xl font-bold text-ink-900">{formatINR(totalArr)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-ink-400 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Pipeline Value</span>
          </div>
          <p className="font-display text-xl font-bold text-brand-600">{formatINR(pipelineValue)}</p>
          <p className="text-xs text-ink-400 mt-0.5">Weighted: {formatINR(weightedPipeline)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-ink-400 mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Open Issues</span>
          </div>
          <p className="font-display text-xl font-bold text-red-600">{openIssues.length}</p>
          <p className="text-xs text-ink-400 mt-0.5">{openIssues.filter((i) => i.priority === 'P1').length} P1 critical</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-ink-400 mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium">Avg Satisfaction</span>
          </div>
          <p className="font-display text-xl font-bold text-ink-900">
            {Math.round(data.customer360.reduce((s, c) => s + c.satisfactionScore, 0) / data.customer360.length)}
          </p>
          <p className="text-xs text-ink-400 mt-0.5">across {data.customer360.length} profiles</p>
        </Card>
      </div>

      {/* Health distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Account Health Distribution</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-3 gap-4">
            {(['green', 'amber', 'red'] as const).map((h) => {
              const cfg = h === 'green' ? { label: 'Healthy', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' } : h === 'amber' ? { label: 'At Risk', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' } : { label: 'Critical', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
              return (
                <div key={h} className={`flex flex-col items-center p-5 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                  <HealthDot health={h} />
                  <span className={`font-display text-3xl font-bold mt-2 ${cfg.text}`}>{healthCounts[h]}</span>
                  <span className="text-xs text-ink-500 mt-1 font-medium">{cfg.label}</span>
                  <div className="w-full mt-3">
                    <ProgressBar value={(healthCounts[h] / totalAccounts) * 100} tone={h === 'green' ? 'green' : h === 'amber' ? 'amber' : 'red'} showLabel />
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Segment analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Segment</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            {segmentData.map((s) => (
              <div key={s.segment}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink-700">{s.segment}</span>
                    <Badge tone="neutral">{s.count} accounts</Badge>
                  </div>
                  <span className="text-sm font-semibold text-ink-900">{formatINR(s.arr)}</span>
                </div>
                <ProgressBar value={(s.arr / maxSegmentArr) * 100} tone="brand" />
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Industry distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Accounts by Industry</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {industries.map(([industry, count]) => (
              <div key={industry} className="flex items-center gap-3">
                <span className="text-sm text-ink-600 w-32 truncate">{industry}</span>
                <div className="flex-1 h-6 bg-ink-100 rounded-md overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-md transition-all duration-500 flex items-center justify-end pr-2" style={{ width: `${(count / maxIndustry) * 100}%` }}>
                    <span className="text-xs font-semibold text-white">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Opportunity pipeline by stage */}
        <Card>
          <CardHeader>
            <CardTitle>Opportunity Pipeline by Stage</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {stageData.map((s) => {
              const maxStageValue = Math.max(...stageData.map((x) => x.value), 1);
              return (
                <div key={s.stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-ink-700">{s.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ink-400">{s.count} deals</span>
                      <span className="text-sm font-semibold text-ink-900">{formatINR(s.value)}</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${s.stage === 'Closed Won' ? 'bg-emerald-500' : s.stage === 'Closed Lost' ? 'bg-red-500' : 'bg-brand-500'}`}
                      style={{ width: `${(s.value / maxStageValue) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>

        {/* Issues by category */}
        <Card>
          <CardHeader>
            <CardTitle>Issues by Category</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-3">
              {issueCategoryData.map((c) => (
                <div key={c.category} className="flex items-center gap-3 p-3 rounded-lg border border-ink-100">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-red-50 text-red-600 shrink-0">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-700">{c.category}</p>
                    <p className="text-xs text-ink-400">{c.count} issues</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Interaction channels */}
        <Card>
          <CardHeader>
            <CardTitle>Interactions by Channel</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {channelData.map((c) => (
              <div key={c.channel} className="flex items-center gap-3">
                <span className="text-sm text-ink-600 w-24">{c.channel}</span>
                <div className="flex-1 h-6 bg-ink-100 rounded-md overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-md transition-all duration-500 flex items-center justify-end pr-2" style={{ width: `${(c.count / maxChannel) * 100}%` }}>
                    <span className="text-xs font-semibold text-white">{c.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Sentiment breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Interaction Sentiment</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="font-display text-2xl font-bold text-emerald-700">{sentimentData.positive}</span>
                <span className="text-xs text-emerald-600 mt-1">Positive</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-xl bg-ink-50 border border-ink-200">
                <span className="font-display text-2xl font-bold text-ink-600">{sentimentData.neutral}</span>
                <span className="text-xs text-ink-500 mt-1">Neutral</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-xl bg-red-50 border border-red-200">
                <span className="font-display text-2xl font-bold text-red-700">{sentimentData.negative}</span>
                <span className="text-xs text-red-600 mt-1">Negative</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Top accounts by ARR */}
      <Card>
        <CardHeader>
          <CardTitle>Top Accounts by ARR</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2">
          {topAccounts.map((acc, i) => (
            <button
              key={acc.id}
              onClick={() => onNavigate(`/accounts/${acc.id}`)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-ink-100 hover:bg-ink-50 transition text-left"
            >
              <span className="text-sm font-bold text-ink-400 w-5">#{i + 1}</span>
              <AccountAvatar name={acc.name} gradient={acc.logoColor} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-900 truncate">{acc.name}</p>
                <p className="text-xs text-ink-400">{acc.industry} · {acc.segment}</p>
              </div>
              <span className="text-sm font-semibold text-ink-900">{formatINR(acc.arr)}</span>
              <HealthDot health={acc.health} />
            </button>
          ))}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RM workload */}
        <Card>
          <CardHeader>
            <CardTitle>Relationship Manager Workload</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {rmData.map(([rm, stats]) => (
              <div key={rm} className="flex items-center gap-3 p-3 rounded-lg border border-ink-100">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {rm.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900">{rm}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge tone="brand">{stats.accounts} accounts</Badge>
                    <Badge tone={stats.issues > 3 ? 'red' : stats.issues > 0 ? 'amber' : 'green'}>{stats.issues} open issues</Badge>
                  </div>
                </div>
                <span className="text-sm font-semibold text-ink-900">{formatINR(stats.arr)}</span>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Upcoming renewals */}
        <Card>
          <CardHeader>
            <CardTitle>Renewals Within 90 Days</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2">
            {upcomingRenewals.length === 0 ? (
              <p className="text-sm text-ink-400 py-4 text-center">No renewals in the next 90 days</p>
            ) : (
              upcomingRenewals.map((acc) => {
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
                    <Badge tone={days < 30 ? 'red' : days < 60 ? 'amber' : 'neutral'}>{days}d left</Badge>
                    <HealthDot health={acc.health} />
                  </button>
                );
              })
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
