import { cn } from '@/utils/cn';

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const gradients = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
];

function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br text-white font-semibold shrink-0',
        getGradient(name),
        sizeClasses[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}

export function AccountAvatar({ name, gradient, size = 'md' }: { name: string; gradient?: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-xl bg-gradient-to-br text-white font-display font-bold shrink-0',
        gradient || getGradient(name),
        size === 'sm' && 'h-9 w-9 text-sm',
        size === 'md' && 'h-11 w-11 text-base',
        size === 'lg' && 'h-16 w-16 text-2xl',
      )}
    >
      {getInitials(name)}
    </div>
  );
}
