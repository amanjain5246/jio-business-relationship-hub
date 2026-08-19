import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, message, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {icon && <div className="h-14 w-14 rounded-2xl bg-ink-100 flex items-center justify-center text-ink-400 mb-4">{icon}</div>}
      <h3 className="font-display font-semibold text-ink-700 text-lg">{title}</h3>
      {message && <p className="text-sm text-ink-500 mt-1.5 max-w-sm">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
