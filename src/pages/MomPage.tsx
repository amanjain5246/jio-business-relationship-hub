import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/utils/format';
import { FileText, Check, ArrowRight } from 'lucide-react';

interface MomPageProps {
  onNavigate: (path: string) => void;
}

export function MomPage({ onNavigate }: MomPageProps) {
  const { data, updateMomSummary } = useStore();
  const sorted = [...data.momSummaries].sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime());

  const toggleAction = (momId: string, actionId: string) => {
    const mom = data.momSummaries.find((m) => m.id === momId);
    if (!mom) return;
    updateMomSummary(momId, {
      actionItems: mom.actionItems.map((a) => (a.id === actionId ? { ...a, done: !a.done } : a)),
    });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="MOM Summaries"
        subtitle={`${data.momSummaries.length} minutes of meetings`}
        icon={<FileText className="h-5 w-5" />}
      />

      {sorted.length === 0 ? (
        <Card>
          <EmptyState icon={<FileText className="h-7 w-7" />} title="No MOM summaries" />
        </Card>
      ) : (
        <div className="space-y-4">
          {sorted.map((mom) => {
            const acc = data.accounts.find((a) => a.id === mom.accountId);
            const completedActions = mom.actionItems.filter((a) => a.done).length;
            return (
              <Card key={mom.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display font-semibold text-ink-900">{mom.title}</h3>
                    <Badge tone="neutral">{formatDate(mom.meetingDate)}</Badge>
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  {/* Attendees */}
                  <div>
                    <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-1.5">Attendees</p>
                    <div className="flex flex-wrap gap-1.5">
                      {mom.attendees.map((a, i) => (
                        <Badge key={i} tone="neutral">{a}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Agenda */}
                  <div>
                    <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-1.5">Agenda</p>
                    <ul className="space-y-1">
                      {mom.agenda.map((a, i) => (
                        <li key={i} className="text-sm text-ink-600 flex items-start gap-2">
                          <span className="text-ink-300 mt-0.5">•</span> {a}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Decisions */}
                  <div>
                    <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-1.5">Decisions</p>
                    <ul className="space-y-1">
                      {mom.decisions.map((d, i) => (
                        <li key={i} className="text-sm text-ink-600 flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" /> {d}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Items */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">Action Items</p>
                      <Badge tone={completedActions === mom.actionItems.length ? 'green' : 'amber'}>
                        {completedActions}/{mom.actionItems.length} done
                      </Badge>
                    </div>
                    <ul className="space-y-1.5">
                      {mom.actionItems.map((a) => (
                        <li key={a.id} className="flex items-start gap-2">
                          <button
                            onClick={() => toggleAction(mom.id, a.id)}
                            className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${a.done ? 'bg-emerald-500 border-emerald-500' : 'border-ink-300 hover:border-brand-400'}`}
                          >
                            {a.done && <Check className="h-2.5 w-2.5 text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${a.done ? 'text-ink-400 line-through' : 'text-ink-600'}`}>{a.task}</p>
                            <p className="text-xs text-ink-400">{a.owner} · Due {formatDate(a.dueDate)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-ink-100">
                    <p className="text-xs text-ink-400">Created by {mom.createdBy} · {formatDate(mom.createdAt)}</p>
                    {acc && (
                      <button onClick={() => onNavigate(`/accounts/${acc.id}`)} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                        {acc.name} <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
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

