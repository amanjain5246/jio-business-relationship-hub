import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime } from '@/utils/format';
import { MessageSquare, Search, Phone, Mail, Calendar, Globe, Monitor } from 'lucide-react';
import type { InteractionChannel } from '@/types/models';

const channelIcon: Record<InteractionChannel, typeof Phone> = {
  Call: Phone,
  Email: Mail,
  Meeting: Calendar,
  'Site Visit': Globe,
  Digital: Monitor,
  Conference: MessageSquare,
};

const sentimentTone = { positive: 'green', neutral: 'neutral', negative: 'red' } as const;

export function InteractionsPage() {
  const { data } = useStore();
  const [search, setSearch] = useState('');

  const filtered = data.interactions.filter((i) => {
    const acc = data.accounts.find((a) => a.id === i.accountId);
    return (
      i.subject.toLowerCase().includes(search.toLowerCase()) ||
      (acc?.name.toLowerCase().includes(search.toLowerCase()) ?? false)
    );
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Interactions"
        subtitle={`${data.interactions.length} interactions logged`}
        icon={<MessageSquare className="h-5 w-5" />}
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        <input
          type="text"
          placeholder="Search interactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<MessageSquare className="h-7 w-7" />} title="No interactions found" />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((int) => {
            const acc = data.accounts.find((a) => a.id === int.accountId);
            const contact = data.contacts.find((c) => c.id === int.contactId);
            const ChannelIcon = channelIcon[int.channel];
            return (
              <Card key={int.id}>
                <CardBody className="flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${int.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-600' : int.sentiment === 'negative' ? 'bg-red-50 text-red-600' : 'bg-ink-100 text-ink-500'}`}>
                    <ChannelIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-ink-900">{int.subject}</h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge tone="neutral">{int.channel}</Badge>
                        <Badge tone={sentimentTone[int.sentiment]} dot>{int.sentiment}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-ink-500 mt-1">{int.summary}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-ink-400">
                      {acc && <span className="font-medium text-ink-600">{acc.name}</span>}
                      {contact && <span>· {contact.name}</span>}
                      <span>· {int.direction}</span>
                      {int.durationMins > 0 && <span>· {int.durationMins}m</span>}
                      <span>· {formatDateTime(int.date)}</span>
                    </div>
                  </div>
                  <Avatar name={int.owner} size="sm" />
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
