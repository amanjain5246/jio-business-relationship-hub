import { useStore } from '@/store/StoreContext';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { HealthBadge } from '@/components/ui/HealthBadge';
import { Badge } from '@/components/ui/Badge';
import { AccountAvatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { VerificationBadge } from '@/components/trust/VerificationBadge';
import { formatDate } from '@/utils/format';
import { Users, ArrowRight, TrendingUp, Minus, TrendingDown } from 'lucide-react';
import type { Customer360, VerificationStatus } from '@/types/models';

interface Customer360PageProps {
  onNavigate: (path: string) => void;
}

const trendIcon = { up: TrendingUp, stable: Minus, down: TrendingDown };
const trendTone = { up: 'green', stable: 'amber', down: 'red' } as const;

function overallVerification(c360: Customer360): { status: VerificationStatus; verifiedCount: number } {
  const statuses = [c360.fieldMeta.legalName.verificationStatus, c360.fieldMeta.gst.verificationStatus, c360.fieldMeta.pan.verificationStatus];
  const status: VerificationStatus = statuses.includes('Unverified')
    ? 'Unverified'
    : statuses.includes('Pending Verification')
      ? 'Pending Verification'
      : 'Verified';
  return { status, verifiedCount: statuses.filter((s) => s === 'Verified').length };
}

export function Customer360Page({ onNavigate }: Customer360PageProps) {
  const { data } = useStore();

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Customer 360"
        subtitle="Comprehensive profiles for all accounts"
        icon={<Users className="h-5 w-5" />}
      />

      {data.customer360.length === 0 ? (
        <Card>
          <EmptyState icon={<Users className="h-7 w-7" />} title="No profiles" message="No Customer 360 profiles available." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.customer360.map((c360) => {
            const account = data.accounts.find((a) => a.id === c360.accountId);
            if (!account) return null;
            const TrendIcon = trendIcon[c360.engagementTrend];
            return (
              <Card key={c360.accountId} hover onClick={() => onNavigate(`/accounts/${account.id}`)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AccountAvatar name={account.name} gradient={account.logoColor} size="sm" />
                      <div>
                        <CardTitle>{account.name}</CardTitle>
                        <p className="text-xs text-ink-400 mt-0.5">{account.industry}</p>
                      </div>
                    </div>
                    <HealthBadge health={account.health} size="sm" />
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="flex items-center justify-between gap-2 -mt-1">
                    <p className="text-xs text-ink-500 truncate">{c360.legalName}</p>
                    <VerificationBadge status={overallVerification(c360).status} />
                  </div>
                  <p className="text-sm text-ink-600 leading-relaxed line-clamp-3">{c360.overview}</p>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2.5 rounded-lg bg-ink-50">
                      <p className="text-xs text-ink-400">Satisfaction</p>
                      <p className={`font-display text-lg font-bold mt-0.5 ${c360.satisfactionScore >= 75 ? 'text-emerald-600' : c360.satisfactionScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {c360.satisfactionScore}
                      </p>
                    </div>
                    <div className="text-center p-2.5 rounded-lg bg-ink-50">
                      <p className="text-xs text-ink-400">NPS</p>
                      <p className={`font-display text-lg font-bold mt-0.5 ${c360.npsScore >= 50 ? 'text-emerald-600' : c360.npsScore >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                        {c360.npsScore > 0 ? '+' : ''}{c360.npsScore}
                      </p>
                    </div>
                    <div className="text-center p-2.5 rounded-lg bg-ink-50">
                      <p className="text-xs text-ink-400">Trend</p>
                      <div className="flex items-center justify-center mt-1">
                        <Badge tone={trendTone[c360.engagementTrend]}>
                          <TrendIcon className="h-3 w-3" /> {c360.engagementTrend}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-2">Products</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c360.productsUsed.map((p, i) => (
                        <Badge key={i} tone="blue" className="text-[10px]">{p}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-2">Key Risks</p>
                    <ul className="space-y-1">
                      {c360.keyRisks.slice(0, 3).map((r, i) => (
                        <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                          <span className="text-red-400">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-ink-100">
                    <div className="text-xs text-ink-400">
                      Last QBR: {formatDate(c360.lastQbrDate)} · Next: {formatDate(c360.nextQbrDate)}
                    </div>
                    <span className="text-xs text-brand-600 font-medium flex items-center gap-1">
                      View profile <ArrowRight className="h-3 w-3" />
                    </span>
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
