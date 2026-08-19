import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { relativeTime } from '@/utils/format';
import { Bell, Check, CheckCheck } from 'lucide-react';
import type { NotificationType } from '@/types/models';

interface NotificationsPageProps {
  onNavigate: (path: string) => void;
}

const typeTone: Record<NotificationType, 'red' | 'green' | 'amber' | 'blue' | 'purple' | 'brand' | 'neutral'> = {
  Issue: 'red',
  Opportunity: 'green',
  Renewal: 'amber',
  Interaction: 'blue',
  'Update Request': 'purple',
  Accountability: 'brand',
  System: 'neutral',
};

const priorityTone = { high: 'red', medium: 'amber', low: 'neutral' } as const;

export function NotificationsPage({ onNavigate }: NotificationsPageProps) {
  const { data, markNotificationRead, markAllNotificationsRead } = useStore();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = filter === 'unread' ? data.notifications.filter((n) => !n.read) : data.notifications;
  const unreadCount = data.notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Notifications"
        subtitle={`${unreadCount} unread of ${data.notifications.length} total`}
        icon={<Bell className="h-5 w-5" />}
        action={unreadCount > 0 ? <Button variant="secondary" onClick={markAllNotificationsRead}><CheckCheck className="h-4 w-4" /> Mark all read</Button> : undefined}
      />

      <div className="flex items-center bg-ink-100 rounded-lg p-0.5 w-fit">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition capitalize ${filter === f ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}
          >
            {f === 'all' ? 'All' : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<Bell className="h-7 w-7" />} title="No notifications" message={filter === 'unread' ? 'All caught up!' : 'No notifications yet.'} />
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <Card key={n.id} hover>
              <CardBody className="flex items-start gap-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${n.read ? 'bg-ink-100 text-ink-400' : 'bg-brand-50 text-brand-600'}`}>
                  <Bell className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-sm ${n.read ? 'font-medium text-ink-700' : 'font-semibold text-ink-900'}`}>{n.title}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge tone={typeTone[n.type]}>{n.type}</Badge>
                      <Badge tone={priorityTone[n.priority]} dot>{n.priority}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-ink-500 mt-1">{n.message}</p>
                  <p className="text-xs text-ink-400 mt-2">{relativeTime(n.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {!n.read && (
                    <button onClick={() => markNotificationRead(n.id)} className="p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition" title="Mark as read">
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  {n.accountId && (
                    <Button size="sm" variant="ghost" onClick={() => onNavigate(`/accounts/${n.accountId}`)}>
                      View
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
