import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn('card', hover && 'card-hover cursor-pointer', className)}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-5 pt-5 pb-3', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn('font-display font-semibold text-ink-900 text-base', className)}>{children}</h3>;
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-5 pb-5', className)}>{children}</div>;
}
