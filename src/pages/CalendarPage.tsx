import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, daysUntil } from '@/utils/format';
import { Calendar as CalIcon, Clock, MapPin, Users, Check } from 'lucide-react';
import type { CalendarType, CalendarRecord } from '@/types/models';

interface CalendarPageProps {
  onNavigate: (path: string) => void;
}

const typeColor: Record<CalendarType, string> = {
  QBR: 'bg-brand-50 text-brand-700 border-brand-200',
  Renewal: 'bg-amber-50 text-amber-700 border-amber-200',
  Review: 'bg-blue-50 text-blue-700 border-blue-200',
  'Follow-up': 'bg-purple-50 text-purple-700 border-purple-200',
  'Executive Meeting': 'bg-red-50 text-red-700 border-red-200',
  Training: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const statusTone = { Scheduled: 'brand', Completed: 'green', Cancelled: 'red' } as const;

export function CalendarPage({ onNavigate }: CalendarPageProps) {
  const { data, updateCalendarRecord } = useStore();
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');
  const [completeId, setCompleteId] = useState<string | null>(null);

  const now = new Date();
  const sorted = [...data.calendar].sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    return view === 'upcoming' ? da - db : db - da;
  });

  const filtered = sorted.filter((c) => {
    const isUpcoming = new Date(c.date) >= now || c.status === 'Scheduled';
    return view === 'upcoming' ? isUpcoming : !isUpcoming;
  });

  const handleComplete = () => {
    if (completeId) {
      updateCalendarRecord(completeId, { status: 'Completed' });
    }
    setCompleteId(null);
  };

  // Group by date
  const grouped: Record<string, CalendarRecord[]> = {};
  filtered.forEach((c) => {
    const key = c.date;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Calendar"
        subtitle={`${data.calendar.length} meetings scheduled`}
        icon={<CalIcon className="h-5 w-5" />}
      />

      <div className="flex items-center bg-ink-100 rounded-lg p-0.5 w-fit">
        {(['upcoming', 'past'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition capitalize ${view === v ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}
          >
            {v === 'upcoming' ? 'Upcoming' : 'Past'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<CalIcon className="h-7 w-7" />} title={`No ${view} meetings`} />
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-brand-600 text-white shrink-0">
                  <span className="text-[10px] font-medium uppercase">{new Date(date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                  <span className="text-xl font-display font-bold leading-none">{new Date(date).getDate()}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">{new Date(date).toLocaleDateString('en-IN', { weekday: 'long' })}</p>
                  <p className="text-xs text-ink-400">{formatDate(date)} · {items.length} {items.length === 1 ? 'meeting' : 'meetings'}</p>
                </div>
              </div>
              <div className="space-y-2 ml-14">
                {items.map((cal) => {
                  const acc = data.accounts.find((a) => a.id === cal.accountId);
                  const days = daysUntil(cal.date);
                  return (
                    <Card key={cal.id} hover onClick={() => acc && onNavigate(`/accounts/${acc.id}`)}>
                      <CardBody className="flex items-start gap-3">
                        <div className={`px-2.5 py-1 rounded-md border text-xs font-medium shrink-0 ${typeColor[cal.type]}`}>
                          {cal.type}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-ink-900">{cal.title}</h3>
                            <Badge tone={statusTone[cal.status]}>{cal.status}</Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-ink-400">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {cal.time} · {cal.durationMins}m</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {cal.location}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-ink-400">
                            <Users className="h-3 w-3" /> {cal.attendees.join(', ')}
                          </div>
                        </div>
                        {cal.status === 'Scheduled' && view === 'upcoming' && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="ghost" onClick={() => setCompleteId(cal.id)}>
                              <Check className="h-3.5 w-3.5" /> Done
                            </Button>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!completeId}
        onClose={() => setCompleteId(null)}
        title="Mark Meeting as Completed?"
        size="sm"
        footer={
          <>
            <Button onClick={() => setCompleteId(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleComplete}>
              <Check className="h-4 w-4" /> Mark Completed
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">This will update the meeting status to "Completed".</p>
      </Modal>
    </div>
  );
}
