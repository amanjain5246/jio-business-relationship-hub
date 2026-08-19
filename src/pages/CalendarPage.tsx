import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/ToastProvider';
import { formatDate, formatDateTime, genId } from '@/utils/format';
import { findSchedulingConflicts } from '@/utils/schedulingEngine';
import { Calendar as CalIcon, Clock, MapPin, Users, Check, CalendarClock, Ban, History, AlertTriangle } from 'lucide-react';
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
  const { data, updateCalendarRecord, addSchedulingHistory, addNotification } = useStore();
  const toast = useToast();
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');
  const [completeId, setCompleteId] = useState<string | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

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
      toast.success('Meeting marked as completed.');
    }
    setCompleteId(null);
  };

  const openReschedule = (cal: CalendarRecord) => {
    setRescheduleId(cal.id);
    setRescheduleDate(cal.date);
    setRescheduleTime(cal.time);
    setRescheduleReason('');
  };

  const rescheduleCal = rescheduleId ? data.calendar.find((c) => c.id === rescheduleId) || null : null;
  const rescheduleConflicts =
    rescheduleCal && rescheduleDate && rescheduleTime
      ? findSchedulingConflicts(data, {
          accountId: rescheduleCal.accountId,
          owner: rescheduleCal.owner,
          date: rescheduleDate,
          time: rescheduleTime,
          durationMins: rescheduleCal.durationMins,
          excludeId: rescheduleCal.id,
        })
      : [];
  const rescheduleUnchanged = !!rescheduleCal && rescheduleDate === rescheduleCal.date && rescheduleTime === rescheduleCal.time;

  const confirmReschedule = () => {
    if (!rescheduleCal || !rescheduleDate || !rescheduleTime || rescheduleUnchanged) return;
    const now = new Date().toISOString();
    const acc = data.accounts.find((a) => a.id === rescheduleCal.accountId);
    updateCalendarRecord(rescheduleCal.id, { date: rescheduleDate, time: rescheduleTime, status: 'Scheduled' });
    addSchedulingHistory({
      id: genId('sch'),
      calendarId: rescheduleCal.id,
      action: 'Rescheduled',
      oldDate: rescheduleCal.date,
      oldTime: rescheduleCal.time,
      newDate: rescheduleDate,
      newTime: rescheduleTime,
      reason: rescheduleReason.trim() || undefined,
      actor: rescheduleCal.owner,
      timestamp: now,
    });
    addNotification({
      id: genId('not'),
      type: 'System',
      title: `Meeting rescheduled: ${acc?.name || rescheduleCal.title}`,
      message: `${rescheduleCal.title} moved from ${formatDate(rescheduleCal.date)} ${rescheduleCal.time} to ${formatDate(rescheduleDate)} ${rescheduleTime}.`,
      accountId: rescheduleCal.accountId,
      createdAt: now,
      read: false,
      priority: 'medium',
    });
    toast.success(`Meeting moved to ${formatDate(rescheduleDate)} at ${rescheduleTime}.`);
    setRescheduleId(null);
  };

  const cancelCal = cancelId ? data.calendar.find((c) => c.id === cancelId) || null : null;

  const confirmCancel = () => {
    if (!cancelCal || !cancelReason.trim()) return;
    const now = new Date().toISOString();
    const acc = data.accounts.find((a) => a.id === cancelCal.accountId);
    updateCalendarRecord(cancelCal.id, { status: 'Cancelled' });
    addSchedulingHistory({
      id: genId('sch'),
      calendarId: cancelCal.id,
      action: 'Cancelled',
      oldDate: cancelCal.date,
      oldTime: cancelCal.time,
      reason: cancelReason.trim(),
      actor: cancelCal.owner,
      timestamp: now,
    });
    addNotification({
      id: genId('not'),
      type: 'System',
      title: `Meeting cancelled: ${acc?.name || cancelCal.title}`,
      message: `${cancelCal.title} on ${formatDate(cancelCal.date)} was cancelled. Reason: ${cancelReason.trim()}`,
      accountId: cancelCal.accountId,
      createdAt: now,
      read: false,
      priority: 'medium',
    });
    toast.warning('Meeting cancelled.');
    setCancelId(null);
    setCancelReason('');
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
            className={`px-4 py-2 rounded-md text-sm font-medium transition capitalize ${view === v ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}
          >
            {v === 'upcoming' ? 'Upcoming' : 'Past'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalIcon className="h-7 w-7" />}
            title={`No ${view} meetings`}
            message={view === 'upcoming' ? 'Schedule a follow-up from an account or the Mobile URM wizard.' : 'Completed and cancelled meetings will appear here.'}
          />
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
                  const history = data.schedulingHistory
                    .filter((h) => h.calendarId === cal.id)
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                  const isHistoryOpen = expandedHistoryId === cal.id;
                  return (
                    <Card key={cal.id} hover onClick={() => acc && onNavigate(`/accounts/${acc.id}`)}>
                      <CardBody className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className={`px-2.5 py-1 rounded-md border text-xs font-medium shrink-0 ${typeColor[cal.type]}`}>
                            {cal.type}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm font-semibold text-ink-900">{cal.title}</h3>
                              <Badge tone={statusTone[cal.status]}>{cal.status}</Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-ink-400 flex-wrap">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {cal.time} · {cal.durationMins}m</span>
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {cal.location}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-ink-400">
                              <Users className="h-3 w-3" /> {cal.attendees.join(', ')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setExpandedHistoryId(isHistoryOpen ? null : cal.id)}
                            className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-700 py-1.5 px-1 -ml-1"
                          >
                            <History className="h-3.5 w-3.5" /> History {history.length > 0 && `(${history.length})`}
                          </button>
                          {cal.status === 'Scheduled' && view === 'upcoming' && (
                            <div className="flex items-center gap-2">
                              <Button size="sm" onClick={() => openReschedule(cal)}>
                                <CalendarClock className="h-3.5 w-3.5" /> Reschedule
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => { setCancelId(cal.id); setCancelReason(''); }}>
                                <Ban className="h-3.5 w-3.5" /> Cancel
                              </Button>
                              <Button size="sm" variant="primary" onClick={() => setCompleteId(cal.id)}>
                                <Check className="h-3.5 w-3.5" /> Done
                              </Button>
                            </div>
                          )}
                        </div>

                        {isHistoryOpen && (
                          <div className="pt-2 border-t border-ink-100 space-y-2" onClick={(e) => e.stopPropagation()}>
                            {history.length === 0 ? (
                              <p className="text-xs text-ink-400">No reschedule or cancellation history for this meeting yet.</p>
                            ) : (
                              history.map((h) => (
                                <div key={h.id} className="flex items-start gap-2 text-xs">
                                  <Badge tone={h.action === 'Cancelled' ? 'red' : h.action === 'Rescheduled' ? 'amber' : 'green'} className="shrink-0">
                                    {h.action}
                                  </Badge>
                                  <div className="min-w-0">
                                    {h.action === 'Rescheduled' && (
                                      <p className="text-ink-600">
                                        {formatDate(h.oldDate || '')} {h.oldTime} → {formatDate(h.newDate || '')} {h.newTime}
                                      </p>
                                    )}
                                    {h.reason && <p className="text-ink-500">{h.reason}</p>}
                                    <p className="text-ink-400">{h.actor} · {formatDateTime(h.timestamp)}</p>
                                  </div>
                                </div>
                              ))
                            )}
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

      {/* Mark complete */}
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

      {/* Reschedule */}
      <Modal
        open={!!rescheduleCal}
        onClose={() => setRescheduleId(null)}
        title="Reschedule Meeting"
        footer={
          <>
            <Button onClick={() => setRescheduleId(null)}>Cancel</Button>
            <Button variant="primary" onClick={confirmReschedule} disabled={!rescheduleDate || !rescheduleTime || rescheduleUnchanged}>
              <CalendarClock className="h-4 w-4" /> Confirm Reschedule
            </Button>
          </>
        }
      >
        {rescheduleCal && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-ink-50 border border-ink-100 text-sm">
              <p className="font-medium text-ink-900">{rescheduleCal.title}</p>
              <p className="text-ink-500 text-xs mt-0.5">Currently {formatDate(rescheduleCal.date)} at {rescheduleCal.time}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-ink-700 mb-1.5 block">New Date</label>
                <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-700 mb-1.5 block">New Time</label>
                <input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} className="input" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700 mb-1.5 block">Reason (optional)</label>
              <textarea
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="Why is this meeting being moved?"
                rows={2}
                className="input resize-none"
              />
            </div>
            {rescheduleConflicts.length > 0 && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-1.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-800">
                    Conflicts with {rescheduleConflicts.length} other meeting{rescheduleConflicts.length > 1 ? 's' : ''} at this time:
                  </p>
                </div>
                <ul className="pl-6 space-y-0.5">
                  {rescheduleConflicts.map((c) => (
                    <li key={c.id} className="text-xs text-red-700">{c.title} · {c.time} ({c.durationMins}m) · {c.owner}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel */}
      <Modal
        open={!!cancelCal}
        onClose={() => setCancelId(null)}
        title="Cancel Meeting"
        size="sm"
        footer={
          <>
            <Button onClick={() => setCancelId(null)}>Back</Button>
            <Button variant="danger" onClick={confirmCancel} disabled={!cancelReason.trim()}>
              <Ban className="h-4 w-4" /> Confirm Cancellation
            </Button>
          </>
        }
      >
        {cancelCal && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-ink-50 border border-ink-100 text-sm">
              <p className="font-medium text-ink-900">{cancelCal.title}</p>
              <p className="text-ink-500 text-xs mt-0.5">{formatDate(cancelCal.date)} at {cancelCal.time}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700 mb-1.5 block">Reason for cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Required — why is this meeting being cancelled?"
                rows={3}
                className="input resize-none"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
