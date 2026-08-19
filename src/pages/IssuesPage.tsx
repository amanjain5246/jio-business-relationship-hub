import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { HealthBadge } from '@/components/ui/HealthBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, daysUntil } from '@/utils/format';
import { AlertTriangle, Search } from 'lucide-react';
import type { IssueStatus, IssuePriority } from '@/types/models';

const statusTone: Record<IssueStatus, 'red' | 'amber' | 'green' | 'neutral'> = {
  Open: 'neutral',
  'In Progress': 'amber',
  Escalated: 'red',
  Resolved: 'green',
  Closed: 'green',
};

const priorityTone: Record<IssuePriority, 'red' | 'amber' | 'neutral'> = {
  P1: 'red',
  P2: 'amber',
  P3: 'neutral',
  P4: 'neutral',
};

export function IssuesPage() {
  const { data, updateIssue } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');
  const [editIssue, setEditIssue] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<IssueStatus>('Open');

  const filtered = data.issues.filter((i) => {
    const acc = data.accounts.find((a) => a.id === i.accountId);
    const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase()) || (acc?.name.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const issueBeingEdited = editIssue ? data.issues.find((i) => i.id === editIssue) : null;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Issues"
        subtitle={`${data.issues.length} issues tracked`}
        icon={<AlertTriangle className="h-5 w-5" />}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="text"
            placeholder="Search issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex items-center bg-ink-100 rounded-lg p-0.5 overflow-x-auto">
          {(['all', 'Open', 'In Progress', 'Escalated', 'Resolved', 'Closed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${statusFilter === s ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<AlertTriangle className="h-7 w-7" />} title="No issues found" />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((iss) => {
            const acc = data.accounts.find((a) => a.id === iss.accountId);
            const overdue = daysUntil(iss.dueDate) < 0 && iss.status !== 'Resolved' && iss.status !== 'Closed';
            return (
              <Card key={iss.id} hover>
                <CardBody className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-red-50 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-ink-900">{iss.title}</h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge tone={priorityTone[iss.priority]}>{iss.priority}</Badge>
                        <Badge tone={statusTone[iss.status]}>{iss.status}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-ink-500 mt-1">{iss.description}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-ink-400">
                      {acc && <span className="font-medium text-ink-600">{acc.name}</span>}
                      <span>· {iss.category}</span>
                      <span>· {iss.assignedTo}</span>
                      <span className={overdue ? 'text-red-600 font-medium' : ''}>
                        · Due {formatDate(iss.dueDate)} {overdue && '(overdue)'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <HealthBadge health={iss.healthImpact} size="sm" showLabel={false} />
                    <Button size="sm" onClick={() => { setEditIssue(iss.id); setEditStatus(iss.status); }}>
                      Update
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!issueBeingEdited}
        onClose={() => setEditIssue(null)}
        title="Update Issue Status"
        footer={
          <>
            <Button onClick={() => setEditIssue(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => {
              if (editIssue) {
                updateIssue(editIssue, {
                  status: editStatus,
                  updatedAt: new Date().toISOString().split('T')[0],
                  resolvedAt: editStatus === 'Resolved' || editStatus === 'Closed' ? new Date().toISOString().split('T')[0] : null,
                });
              }
              setEditIssue(null);
            }}>
              Save
            </Button>
          </>
        }
      >
        {issueBeingEdited && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-ink-700">{issueBeingEdited.title}</p>
              <p className="text-xs text-ink-400 mt-1">{issueBeingEdited.description}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700 mb-2 block">Status</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Open', 'In Progress', 'Escalated', 'Resolved', 'Closed'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setEditStatus(s)}
                    className={`py-2.5 rounded-lg border-2 text-sm font-medium transition ${editStatus === s ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600 hover:border-ink-300'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
