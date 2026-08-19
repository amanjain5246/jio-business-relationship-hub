import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/ToastProvider';
import { formatDate, formatDateTime } from '@/utils/format';
import { FileEdit, Check, X, HelpCircle, Paperclip, Mail, Users as UsersIcon } from 'lucide-react';
import type { UpdateRequestStatus } from '@/types/models';

const statusTone: Record<UpdateRequestStatus, 'green' | 'red' | 'amber' | 'neutral'> = {
  Approved: 'green',
  Rejected: 'red',
  Pending: 'amber',
  'Action Required': 'amber',
};

export function UpdateRequestsPage() {
  const { data, decideUpdateRequest } = useStore();
  const toast = useToast();
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [clarificationNote, setClarificationNote] = useState('');
  const [decidingAction, setDecidingAction] = useState<'Approved' | 'Rejected' | 'Action Required' | null>(null);

  const reqBeingReviewed = reviewing ? data.updateRequests.find((r) => r.id === reviewing) : null;

  const openReview = (id: string) => {
    setReviewing(id);
    setClarificationNote('');
  };

  const closeReview = () => {
    setReviewing(null);
    setClarificationNote('');
  };

  const decide = (decision: 'Approved' | 'Rejected' | 'Action Required') => {
    if (!reviewing || decidingAction) return;
    if (decision === 'Action Required' && !clarificationNote.trim()) return;
    const field = reqBeingReviewed?.field || 'Field';
    setDecidingAction(decision);
    setTimeout(() => {
      decideUpdateRequest(
        reviewing,
        decision,
        'Leadership',
        decision === 'Action Required' ? clarificationNote.trim() : undefined,
      );
      if (decision === 'Approved') toast.success(`${field} update approved and applied.`);
      else if (decision === 'Rejected') toast.error(`${field} update rejected.`);
      else toast.warning(`Clarification requested for ${field} update.`);
      setDecidingAction(null);
      closeReview();
    }, 400);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Update Requests"
        subtitle={`${data.updateRequests.length} requests · ${data.updateRequests.filter((r) => r.status === 'Pending').length} pending`}
        icon={<FileEdit className="h-5 w-5" />}
      />

      {data.updateRequests.length === 0 ? (
        <Card>
          <EmptyState icon={<FileEdit className="h-7 w-7" />} title="No update requests" />
        </Card>
      ) : (
        <div className="space-y-3">
          {data.updateRequests.map((req) => {
            const acc = data.accounts.find((a) => a.id === req.accountId);
            return (
              <Card key={req.id}>
                <CardBody className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-purple-50 text-purple-600">
                    <FileEdit className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-1.5">
                        {req.field} Update Request
                        {req.attachment && <Paperclip className="h-3.5 w-3.5 text-ink-400" />}
                      </h3>
                      <Badge tone={statusTone[req.status]} dot>{req.status}</Badge>
                    </div>
                    <p className="text-sm text-ink-500 mt-1">{req.reason}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-ink-400">
                      {acc && <span className="font-medium text-ink-600">{acc.name}</span>}
                      <span>· {req.requestedBy}</span>
                      <span>· {formatDate(req.requestedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-ink-50">
                      <span className="text-sm text-ink-500 line-through">{req.currentValue}</span>
                      <span className="text-ink-300">→</span>
                      <span className="text-sm font-medium text-brand-700">{req.requestedValue}</span>
                    </div>
                    {req.status === 'Action Required' && req.clarificationNote && (
                      <p className="text-xs text-amber-700 mt-2 flex items-start gap-1.5">
                        <HelpCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {req.clarificationNote}
                      </p>
                    )}
                    {(req.customerNotifiedAt || req.urmNotifiedAt) && (
                      <div className="flex items-center gap-2 mt-2">
                        {req.customerNotifiedAt && (
                          <span className="chip bg-blue-50 text-blue-700 text-[10px]">
                            <Mail className="h-3 w-3" /> Customer Notified
                          </span>
                        )}
                        {req.urmNotifiedAt && (
                          <span className="chip bg-purple-50 text-purple-700 text-[10px]">
                            <UsersIcon className="h-3 w-3" /> URM Notified
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {(req.status === 'Pending' || req.status === 'Action Required') && (
                    <Button size="sm" variant="primary" onClick={() => openReview(req.id)}>
                      Review
                    </Button>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!reqBeingReviewed}
        onClose={closeReview}
        title="Review Update Request"
        size="lg"
        footer={
          <>
            <Button variant="danger" onClick={() => decide('Rejected')} loading={decidingAction === 'Rejected'} disabled={!!decidingAction}>
              <X className="h-4 w-4" /> Reject
            </Button>
            <Button
              onClick={() => decide('Action Required')}
              loading={decidingAction === 'Action Required'}
              disabled={!clarificationNote.trim() || !!decidingAction}
            >
              <HelpCircle className="h-4 w-4" /> Request Clarification
            </Button>
            <Button variant="primary" onClick={() => decide('Approved')} loading={decidingAction === 'Approved'} disabled={!!decidingAction}>
              <Check className="h-4 w-4" /> Approve
            </Button>
          </>
        }
      >
        {reqBeingReviewed && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-ink-400 font-medium uppercase tracking-wide">Account</p>
                <p className="text-sm font-medium text-ink-900 mt-0.5">
                  {data.accounts.find((a) => a.id === reqBeingReviewed.accountId)?.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-400 font-medium uppercase tracking-wide">Field</p>
                <p className="text-sm font-medium text-ink-900 mt-0.5">{reqBeingReviewed.field}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-ink-50">
              <div className="flex-1">
                <p className="text-xs text-ink-400">Current</p>
                <p className="text-sm text-ink-500 line-through">{reqBeingReviewed.currentValue}</p>
              </div>
              <span className="text-ink-300">→</span>
              <div className="flex-1">
                <p className="text-xs text-ink-400">Proposed</p>
                <p className="text-sm font-medium text-brand-700">{reqBeingReviewed.requestedValue}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-ink-400 font-medium uppercase tracking-wide">Reason</p>
              <p className="text-sm text-ink-600 mt-0.5">{reqBeingReviewed.reason}</p>
            </div>
            <div>
              <p className="text-xs text-ink-400 font-medium uppercase tracking-wide">Requested by</p>
              <p className="text-sm text-ink-600 mt-0.5">
                {reqBeingReviewed.requestedBy} · {formatDate(reqBeingReviewed.requestedAt)}
              </p>
            </div>
            {reqBeingReviewed.attachment && (
              <div>
                <p className="text-xs text-ink-400 font-medium uppercase tracking-wide">Attachment</p>
                <div className="flex items-center gap-2 mt-1 p-2 rounded-lg border border-ink-100 text-sm text-ink-700 w-fit">
                  <Paperclip className="h-4 w-4 text-ink-400" />
                  {reqBeingReviewed.attachment.name}
                  <span className="text-xs text-ink-400">
                    ({reqBeingReviewed.attachment.kind} · {reqBeingReviewed.attachment.sizeKb} KB)
                  </span>
                </div>
              </div>
            )}
            {reqBeingReviewed.clarificationNote && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Prior Clarification Request</p>
                <p className="text-sm text-amber-800 mt-1">{reqBeingReviewed.clarificationNote}</p>
              </div>
            )}
            <div>
              <label className="text-xs text-ink-400 font-medium uppercase tracking-wide mb-1.5 block">
                Clarification note (required to request clarification)
              </label>
              <textarea
                value={clarificationNote}
                onChange={(e) => setClarificationNote(e.target.value)}
                placeholder="What additional information or documentation is needed?"
                rows={2}
                className="input resize-none"
              />
            </div>
            {reqBeingReviewed.auditTrail.length > 0 && (
              <div>
                <p className="text-xs text-ink-400 font-medium uppercase tracking-wide mb-1.5">Audit Trail</p>
                <div className="space-y-2">
                  {reqBeingReviewed.auditTrail.map((a) => (
                    <div key={a.id} className="text-xs text-ink-500 flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-ink-300 mt-1.5 shrink-0" />
                      <span>
                        <span className="font-medium text-ink-700">{a.action}</span> — {a.detail}
                        <span className="text-ink-400"> · {a.actor} · {formatDateTime(a.timestamp)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
