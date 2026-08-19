import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/utils/format';
import { FileEdit, Check, X } from 'lucide-react';
import type { UpdateRequestStatus } from '@/types/models';

const statusTone: Record<UpdateRequestStatus, 'green' | 'red' | 'amber' | 'neutral'> = {
  Approved: 'green',
  Rejected: 'red',
  Pending: 'amber',
  'Action Required': 'red',
};

export function UpdateRequestsPage() {
  const { data, updateUpdateRequest } = useStore();
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<'Approved' | 'Rejected'>('Approved');

  const reqBeingReviewed = reviewing ? data.updateRequests.find((r) => r.id === reviewing) : null;

  const handleReview = () => {
    if (reviewing) {
      updateUpdateRequest(reviewing, {
        status: reviewAction,
        reviewedBy: 'Leadership',
        reviewedAt: new Date().toISOString().split('T')[0],
      });
    }
    setReviewing(null);
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
                      <h3 className="text-sm font-semibold text-ink-900">{req.field} Update Request</h3>
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
                  </div>
                  {(req.status === 'Pending' || req.status === 'Action Required') && (
                    <Button size="sm" variant="primary" onClick={() => { setReviewing(req.id); setReviewAction('Approved'); }}>
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
        onClose={() => setReviewing(null)}
        title="Review Update Request"
        footer={
          <>
            <Button variant="danger" onClick={() => { setReviewAction('Rejected'); handleReview(); }}>
              <X className="h-4 w-4" /> Reject
            </Button>
            <Button variant="primary" onClick={() => { setReviewAction('Approved'); handleReview(); }}>
              <Check className="h-4 w-4" /> Approve
            </Button>
          </>
        }
      >
        {reqBeingReviewed && (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-ink-400 font-medium uppercase tracking-wide">Account</p>
              <p className="text-sm font-medium text-ink-900 mt-0.5">{data.accounts.find((a) => a.id === reqBeingReviewed.accountId)?.name}</p>
            </div>
            <div>
              <p className="text-xs text-ink-400 font-medium uppercase tracking-wide">Field</p>
              <p className="text-sm font-medium text-ink-900 mt-0.5">{reqBeingReviewed.field}</p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-ink-50">
              <div className="flex-1">
                <p className="text-xs text-ink-400">Current</p>
                <p className="text-sm text-ink-500 line-through">{reqBeingReviewed.currentValue}</p>
              </div>
              <span className="text-ink-300">→</span>
              <div className="flex-1">
                <p className="text-xs text-ink-400">Requested</p>
                <p className="text-sm font-medium text-brand-700">{reqBeingReviewed.requestedValue}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-ink-400 font-medium uppercase tracking-wide">Reason</p>
              <p className="text-sm text-ink-600 mt-0.5">{reqBeingReviewed.reason}</p>
            </div>
            <div>
              <p className="text-xs text-ink-400 font-medium uppercase tracking-wide">Requested by</p>
              <p className="text-sm text-ink-600 mt-0.5">{reqBeingReviewed.requestedBy} · {formatDate(reqBeingReviewed.requestedAt)}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
