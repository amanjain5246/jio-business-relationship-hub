import type { AccountHealth } from '@/types/models';

export function formatINR(lakhs: number): string {
  if (lakhs >= 100) {
    return `₹${(lakhs / 100).toFixed(2)} Cr`;
  }
  return `₹${lakhs.toFixed(0)} L`;
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function daysUntil(iso: string): number {
  const d = new Date(iso);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function relativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(iso);
}

export const healthConfig: Record<
  AccountHealth,
  { label: string; dot: string; badge: string; text: string; bg: string; border: string }
> = {
  green: {
    label: 'Healthy',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  amber: {
    label: 'At Risk',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    text: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  red: {
    label: 'Critical',
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-200',
    text: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
};

export function getAccountName(data: { accounts: { id: string; name: string }[] }, accountId: string | null): string {
  if (!accountId) return '—';
  const acc = data.accounts.find((a) => a.id === accountId);
  return acc ? acc.name : 'Unknown';
}

export function getContactName(
  data: { contacts: { id: string; name: string }[] },
  contactId: string | null,
): string {
  if (!contactId) return '—';
  const c = data.contacts.find((x) => x.id === contactId);
  return c ? c.name : '—';
}

export function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
