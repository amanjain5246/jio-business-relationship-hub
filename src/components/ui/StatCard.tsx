import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: 'brand' | 'green' | 'amber' | 'red' | 'blue';
  subtext?: string;
}

const toneClasses = {
  brand: 'bg-brand-50 text-brand-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  blue: 'bg-blue-50 text-blue-600',
};

export function StatCard({ label, value, icon, tone = 'brand', subtext }: StatCardProps) {
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <p className="text-sm text-ink-500 font-medium">{label}</p>
        <p className="font-display text-2xl font-bold text-ink-900 mt-1">{value}</p>
        {subtext && <p className="text-xs text-ink-400 mt-1">{subtext}</p>}
      </div>
      <div className={cn('h-11 w-11 rounded-lg flex items-center justify-center', toneClasses[tone])}>
        {icon}
      </div>
    </div>
  );
}
