import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, action, icon, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-5', className)}>
      <div className="flex items-start gap-3">
        {icon && <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">{icon}</div>}
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">{title}</h1>
          {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
