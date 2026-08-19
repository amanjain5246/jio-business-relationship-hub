import { useStore } from '@/store/StoreContext';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/utils/format';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import type { AccountabilityEventType } from '@/types/models';

interface AccountabilityPageProps {
  onNavigate: (path: string) => void;
}

const typeTone: Record<AccountabilityEventType, 'red' | 'amber' | 'green' | 'brand' | 'blue'> = {
  'RM Change': 'amber',
  Escalation: 'red',
  'Executive Sponsor': 'blue',
  'QBR Held': 'green',
  'Contract Signed': 'green',
  'Health Review': 'brand',
  'Site Visit': 'blue',
  'Interaction Logged': 'brand',
};

const impactTone = { High: 'red', Medium: 'amber', Low: 'neutral' } as const;

export function AccountabilityPage({ onNavigate }: AccountabilityPageProps) {
  const { data } = useStore();
  const sorted = [...data.accountabilityEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Accountability Events"
        subtitle={`${data.accountabilityEvents.length} events tracked`}
        icon={<ShieldCheck className="h-5 w-5" />}
      />

      {sorted.length === 0 ? (
        <Card>
          <EmptyState icon={<ShieldCheck className="h-7 w-7" />} title="No events" />
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-2 bottom-2 w-px bg-ink-200" />

          <div className="space-y-4">
            {sorted.map((evt) => {
              const acc = data.accounts.find((a) => a.id === evt.accountId);
              return (
                <div key={evt.id} className="relative flex items-start gap-4 pl-0">
                  <div className="h-10 w-10 rounded-full bg-white border-2 border-brand-200 flex items-center justify-center shrink-0 z-10">
                    <ShieldCheck className="h-4 w-4 text-brand-600" />
                  </div>
                  <Card className="flex-1" hover>
                    <CardBody className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-ink-900">{evt.title}</h3>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge tone={typeTone[evt.type]}>{evt.type}</Badge>
                          <Badge tone={impactTone[evt.impact]}>{evt.impact} impact</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-ink-500">{evt.description}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-ink-100">
                        <div className="flex items-center gap-2">
                          <Avatar name={evt.actor} size="xs" />
                          <span className="text-xs text-ink-400">{evt.actor} · {formatDate(evt.date)}</span>
                        </div>
                        {acc && (
                          <button onClick={() => onNavigate(`/accounts/${acc.id}`)} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                            {acc.name} <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
