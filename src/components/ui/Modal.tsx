import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={cn('relative w-full bg-white rounded-2xl shadow-pop animate-scale-in max-h-[90vh] flex flex-col', sizeClasses[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
          <h2 className="font-display font-semibold text-lg text-ink-900">{title}</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 transition text-xl leading-none">
            ×
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-ink-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
