import type { AccountHealth } from '@/types/models';
import { healthConfig } from '@/utils/format';
import { cn } from '@/utils/cn';

interface HealthBadgeProps {
  health: AccountHealth;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function HealthBadge({ health, size = 'md', showLabel = true }: HealthBadgeProps) {
  const cfg = healthConfig[health];
  return (
    <span
      className={cn(
        'chip border',
        cfg.badge,
        size === 'sm' && 'px-2 py-0.5 text-[11px]',
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
      {showLabel && cfg.label}
    </span>
  );
}

export function HealthDot({ health }: { health: AccountHealth }) {
  const cfg = healthConfig[health];
  return <span className={cn('inline-block h-2.5 w-2.5 rounded-full', cfg.dot)} />;
}
