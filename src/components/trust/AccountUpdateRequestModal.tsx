import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { genId } from '@/utils/format';
import type { Account, UpdateRequest, UpdateRequestAttachment } from '@/types/models';
import { Paperclip, Send, X } from 'lucide-react';

interface AccountUpdateRequestModalProps {
  account: Account;
  field: string;
  currentValue: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function AccountUpdateRequestModal({ account, field, currentValue, onClose, onSubmitted }: AccountUpdateRequestModalProps) {
  const { addUpdateRequest } = useStore();
  const toast = useToast();
  const [proposedValue, setProposedValue] = useState('');
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState<UpdateRequestAttachment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const kind: UpdateRequestAttachment['kind'] = file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(file.name) ? 'Image' : 'PDF';
    setAttachment({ name: file.name, kind, sizeKb: Math.max(1, Math.round(file.size / 1024)) });
    e.target.value = '';
  };

  const canSubmit = proposedValue.trim().length > 0 && proposedValue.trim() !== currentValue && reason.trim().length > 0 && !!attachment;
  const hasUnsavedInput = proposedValue.trim().length > 0 || reason.trim().length > 0 || !!attachment;

  const requestClose = () => {
    if (hasUnsavedInput && !window.confirm('Discard this update request? What you\'ve entered will be lost.')) return;
    onClose();
  };

  const handleSubmit = () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const now = new Date().toISOString();
    const req: UpdateRequest = {
      id: genId('upd'),
      accountId: account.id,
      field,
      currentValue,
      requestedValue: proposedValue.trim(),
      reason: reason.trim(),
      requestedBy: account.relationshipManager,
      requestedAt: now.slice(0, 10),
      status: 'Pending',
      reviewedBy: null,
      reviewedAt: null,
      attachment,
      clarificationNote: null,
      customerNotifiedAt: null,
      urmNotifiedAt: null,
      auditTrail: [
        {
          id: genId('aud'),
          actor: account.relationshipManager,
          action: 'Submitted',
          detail: `${field} update request submitted with supporting document for verification.`,
          timestamp: now,
        },
      ],
    };
    setTimeout(() => {
      addUpdateRequest(req);
      toast.success(`${field} update request submitted for review.`);
      onSubmitted?.();
      setSubmitting(false);
      onClose();
    }, 350);
  };

  return (
    <Modal
      open
      onClose={requestClose}
      title={`Request ${field} Change`}
      footer={
        <>
          <Button onClick={requestClose} disabled={submitting}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit} loading={submitting}>
            <Send className="h-4 w-4" /> Submit Request
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-ink-500">
          {field} is trust-sensitive master data and cannot be edited directly. Submit a request with supporting
          documentation — it will only take effect once approved.
        </p>
        <div>
          <label className="text-sm font-medium text-ink-700 mb-1.5 block">Current Value</label>
          <div className="input bg-ink-50 text-ink-500">{currentValue || '—'}</div>
        </div>
        <div>
          <label className="text-sm font-medium text-ink-700 mb-1.5 block">Proposed Value</label>
          <input
            type="text"
            value={proposedValue}
            onChange={(e) => setProposedValue(e.target.value)}
            placeholder={`Enter corrected ${field}`}
            className="input"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-ink-700 mb-1.5 block">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this change is needed..."
            rows={3}
            className="input resize-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-ink-700 mb-1.5 block">Supporting Document (Image or PDF)</label>
          {attachment ? (
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-ink-200 bg-ink-50">
              <span className="flex items-center gap-2 text-sm text-ink-700 min-w-0">
                <Paperclip className="h-4 w-4 shrink-0 text-ink-400" />
                <span className="truncate">{attachment.name}</span>
                <span className="text-xs text-ink-400 shrink-0">({attachment.kind} · {attachment.sizeKb} KB)</span>
              </span>
              <button type="button" onClick={() => setAttachment(null)} className="p-2 -m-2 rounded-lg text-ink-400 hover:text-red-600 hover:bg-red-50 shrink-0 transition" aria-label="Remove attachment">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-ink-200 text-sm text-ink-500 cursor-pointer hover:border-brand-300 hover:text-brand-600 transition">
              <Paperclip className="h-4 w-4" /> Attach image or PDF
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
            </label>
          )}
          <p className="text-xs text-ink-400 mt-1">Simulated upload — the file is not stored, only its name and size are recorded.</p>
        </div>
      </div>
    </Modal>
  );
}
