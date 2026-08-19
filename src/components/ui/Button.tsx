import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

const variantClasses: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn bg-red-600 text-white hover:bg-red-700 shadow-sm',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export function Button({
  children,
  onClick,
  variant = 'secondary',
  size = 'md',
  disabled,
  className,
  type = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(variantClasses[variant], sizeClasses[size], className)}
    >
      {children}
    </button>
  );
}
