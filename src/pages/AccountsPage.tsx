import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { HealthBadge } from '@/components/ui/HealthBadge';
import { Badge } from '@/components/ui/Badge';
import { AccountAvatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatINR, formatDate, daysUntil } from '@/utils/format';
import { openIssueCount, openOpportunityCount, contactCount } from '@/utils/accountStats';
import { Building2, Search, Filter } from 'lucide-react';
import type { AccountHealth } from '@/types/models';

interface AccountsPageProps {
  onNavigate: (path: string) => void;
}

export function AccountsPage({ onNavigate }: AccountsPageProps) {
  const { data, viewMode } = useStore();
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState<AccountHealth | 'all'>('all');

  const filtered = data.accounts.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.industry.toLowerCase().includes(search.toLowerCase());
    const matchesHealth = healthFilter === 'all' || a.health === healthFilter;
    return matchesSearch && matchesHealth;
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Accounts"
        subtitle={`${data.accounts.length} accounts in your portfolio`}
        icon={<Building2 className="h-5 w-5" />}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-ink-400" />
          <div className="flex items-center bg-ink-100 rounded-lg p-0.5">
            {(['all', 'green', 'amber', 'red'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHealthFilter(h)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition capitalize ${healthFilter === h ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}
              >
                {h === 'all' ? 'All' : h === 'green' ? 'Healthy' : h === 'amber' ? 'At Risk' : 'Critical'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Account grid */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<Building2 className="h-7 w-7" />} title="No accounts found" message="Try adjusting your search or filter." />
        </Card>
      ) : (
        <div className={`grid grid-cols-1 gap-4 ${viewMode === 'mobile' ? '' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
          {filtered.map((acc) => {
            const renewalDays = daysUntil(acc.contractRenewal);
            const issuesCount = openIssueCount(data, acc.id);
            const oppsCount = openOpportunityCount(data, acc.id);
            const contactsN = contactCount(data, acc.id);
            return (
              <Card key={acc.id} hover onClick={() => onNavigate(`/accounts/${acc.id}`)}>
                <CardBody className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <AccountAvatar name={acc.name} gradient={acc.logoColor} size="md" />
                      <div>
                        <h3 className="font-display font-semibold text-ink-900 text-sm leading-tight">{acc.name}</h3>
                        <p className="text-xs text-ink-400 mt-0.5">{acc.industry}</p>
                      </div>
                    </div>
                    <HealthBadge health={acc.health} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-ink-100">
                    <div>
                      <p className="text-[11px] text-ink-400 font-medium uppercase tracking-wide">ARR</p>
                      <p className="text-sm font-semibold text-ink-900 mt-0.5">{formatINR(acc.arr)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-ink-400 font-medium uppercase tracking-wide">Segment</p>
                      <p className="text-sm font-semibold text-ink-900 mt-0.5">{acc.segment}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-ink-400 font-medium uppercase tracking-wide">Open Issues</p>
                      <p className={`text-sm font-semibold mt-0.5 ${issuesCount > 2 ? 'text-red-600' : issuesCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {issuesCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-ink-400 font-medium uppercase tracking-wide">Opportunities</p>
                      <p className="text-sm font-semibold text-ink-900 mt-0.5">{oppsCount}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-ink-100">
                    <div className="flex items-center gap-2">
                      <Badge tone="neutral">{acc.hqCity}</Badge>
                      <Badge tone="brand">{contactsN} contacts</Badge>
                    </div>
                    <Badge tone={renewalDays < 60 ? 'red' : renewalDays < 120 ? 'amber' : 'neutral'}>
                      Renewal {formatDate(acc.contractRenewal)}
                    </Badge>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
