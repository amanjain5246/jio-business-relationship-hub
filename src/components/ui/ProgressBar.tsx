import { cn } from '@/utils/cn';

interface ProgressBarProps {
  value: number; // 0-100
  tone?: 'brand' | 'green' | 'amber' | 'red';
  className?: string;
  showLabel?: boolean;
}

const toneClasses = {
  brand: 'bg-brand-500',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

export function ProgressBar({ value, tone = 'brand', className, showLabel }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-2 rounded-full bg-ink-100 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', toneClasses[tone])} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <span className="text-xs font-medium text-ink-500 w-9 text-right">{Math.round(pct)}%</span>}
    </div>
  );
}
