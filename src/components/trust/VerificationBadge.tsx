import { BadgeCheck, Clock, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { VerificationStatus } from '@/types/models';

const CONFIG: Record<VerificationStatus, { tone: 'green' | 'amber' | 'gray'; icon: typeof BadgeCheck; label: string }> = {
  Verified: { tone: 'green', icon: BadgeCheck, label: 'Verified' },
  'Pending Verification': { tone: 'amber', icon: Clock, label: 'Pending Verification' },
  Unverified: { tone: 'gray', icon: ShieldAlert, label: 'Unverified' },
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const { tone, icon: Icon, label } = CONFIG[status];
  return (
    <Badge tone={tone}>
      <Icon className="h-3 w-3" /> {label}
    </Badge>
  );
}
