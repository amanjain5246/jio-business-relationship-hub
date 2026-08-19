import { useState, type ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { useStore } from '@/store/StoreContext';
import { cn } from '@/utils/cn';
import { NAV_ITEMS } from '@/config/navigation';
import { X } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activePath: string;
  onNavigate: (path: string) => void;
}

export function Layout({ children, activePath, onNavigate }: LayoutProps) {
  const { viewMode } = useStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleNavigate = (path: string) => {
    onNavigate(path);
    setMobileNavOpen(false);
  };

  return (
    <div className="h-screen flex flex-col bg-ink-50 overflow-hidden">
      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 animate-slide-in">
            <div className="relative h-full">
              <Sidebar activePath={activePath} onNavigate={handleNavigate} />
              <button
                onClick={() => setMobileNavOpen(false)}
                className="absolute top-4 -right-12 h-9 w-9 rounded-lg bg-white shadow-lg flex items-center justify-center text-ink-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <Sidebar activePath={activePath} onNavigate={handleNavigate} />
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar onNavigate={handleNavigate} onToggleMobileNav={() => setMobileNavOpen(true)} />

          {/* Content - with mobile frame when in mobile view */}
          <div className="flex-1 overflow-y-auto">
            <div
              className={cn(
                'mx-auto w-full transition-all duration-300',
                viewMode === 'mobile' ? 'max-w-[420px] border-x border-ink-200 bg-white shadow-lg' : '',
              )}
            >
              <div className={viewMode === 'mobile' ? 'min-h-[calc(100vh-4rem)]' : 'min-h-full'}>
                {viewMode === 'mobile' && (
                  <div className="lg:hidden bg-brand-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/80 animate-pulse" />
                    Mobile Preview Mode
                  </div>
                )}
                <div className={cn(viewMode === 'mobile' ? 'p-4' : 'p-4 md:p-6 lg:p-8')}>
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav (only when in mobile view mode) */}
      {viewMode === 'mobile' && (
        <div className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-ink-200 z-30">
          <div className="flex items-center justify-around px-2 py-1.5">
            {NAV_ITEMS.slice(0, 5).map((item) => {
              const isActive = activePath === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.path)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition',
                    isActive ? 'text-brand-600' : 'text-ink-400',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
