import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type Tone = 'neutral' | 'brand' | 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'gray';

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700',
  brand: 'bg-brand-50 text-brand-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  blue: 'bg-blue-50 text-blue-700',
  purple: 'bg-purple-50 text-purple-700',
  gray: 'bg-gray-100 text-gray-600',
};

const dotClasses: Record<Tone, string> = {
  neutral: 'bg-ink-400',
  brand: 'bg-brand-500',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  gray: 'bg-gray-400',
};

export function Badge({ children, tone = 'neutral', dot, className }: BadgeProps) {
  return (
    <span className={cn('chip', toneClasses[tone], className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotClasses[tone])} />}
      {children}
    </span>
  );
}
