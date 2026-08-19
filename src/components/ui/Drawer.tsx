import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: 'right' | 'left';
}

export function Drawer({ open, onClose, title, children, footer, side = 'right' }: DrawerProps) {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) setMounted(true);
    else {
      const t = setTimeout(() => setMounted(false), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={cn('absolute inset-0 bg-ink-950/40 backdrop-blur-sm transition-opacity', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute top-0 bottom-0 w-full max-w-md bg-white shadow-pop flex flex-col transition-transform duration-200',
          side === 'right' ? 'right-0' : 'left-0',
          open ? 'translate-x-0' : side === 'right' ? 'translate-x-full' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <h2 className="font-display font-semibold text-lg text-ink-900">{title}</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 transition text-xl leading-none">
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-ink-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
