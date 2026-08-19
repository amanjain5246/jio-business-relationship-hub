import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';

type ToastType = 'success' | 'warning' | 'error' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  warning: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const CONFIG: Record<ToastType, { icon: typeof CheckCircle2; classes: string; iconClasses: string }> = {
  success: { icon: CheckCircle2, classes: 'bg-emerald-50 border-emerald-200 text-emerald-800', iconClasses: 'text-emerald-600' },
  warning: { icon: AlertTriangle, classes: 'bg-amber-50 border-amber-200 text-amber-800', iconClasses: 'text-amber-600' },
  error: { icon: XCircle, classes: 'bg-red-50 border-red-200 text-red-800', iconClasses: 'text-red-600' },
  info: { icon: Info, classes: 'bg-blue-50 border-blue-200 text-blue-800', iconClasses: 'text-blue-600' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (type: ToastType, message: string) => {
      counter.current += 1;
      const id = `toast-${Date.now()}-${counter.current}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    success: (m) => show('success', m),
    warning: (m) => show('warning', m),
    error: (m) => show('error', m),
    info: (m) => show('info', m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm">
        {toasts.map((t) => {
          const cfg = CONFIG[t.type];
          const Icon = cfg.icon;
          return (
            <div
              key={t.id}
              role="status"
              className={cn('flex items-start gap-2.5 p-3.5 rounded-xl border shadow-pop animate-fade-in', cfg.classes)}
            >
              <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', cfg.iconClasses)} />
              <p className="text-sm font-medium flex-1 min-w-0">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="p-1 -m-1 rounded hover:bg-black/5 transition shrink-0" aria-label="Dismiss">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
