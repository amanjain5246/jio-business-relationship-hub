import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/store/StoreContext';
import { Bell, Search, Monitor, Smartphone, Menu, RotateCcw, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { relativeTime } from '@/utils/format';
import { NAV_ITEMS } from '@/config/navigation';
import type { NotificationType } from '@/types/models';

interface TopBarProps {
  onNavigate: (path: string) => void;
  onToggleMobileNav: () => void;
}

const notifIconColor: Record<NotificationType, string> = {
  Issue: 'text-red-500 bg-red-50',
  Opportunity: 'text-emerald-500 bg-emerald-50',
  Renewal: 'text-amber-500 bg-amber-50',
  Interaction: 'text-blue-500 bg-blue-50',
  'Update Request': 'text-purple-500 bg-purple-50',
  Accountability: 'text-brand-500 bg-brand-50',
  System: 'text-ink-400 bg-ink-100',
};

export function TopBar({ onNavigate, onToggleMobileNav }: TopBarProps) {
  const { data, viewMode, setViewMode, markNotificationRead, markAllNotificationsRead, resetData } = useStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unread = data.notifications.filter((n) => !n.read);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
      setNotifOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  return (
    <header className="h-16 bg-white border-b border-ink-200 flex items-center justify-between px-4 md:px-6 shrink-0">
      {/* Left: mobile menu + search */}
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onToggleMobileNav}
          className="lg:hidden p-2 -ml-2 rounded-lg text-ink-600 hover:bg-ink-100 transition"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="text"
            placeholder="Search accounts, issues, opportunities..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-ink-50 border border-transparent rounded-lg focus:bg-white focus:border-ink-200 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Right: view switcher, reset, notifications */}
      <div className="flex items-center gap-2">
        {/* View mode switcher */}
        <div className="flex items-center bg-ink-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('desktop')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition',
              viewMode === 'desktop' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700',
            )}
            title="Desktop view"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Desktop</span>
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition',
              viewMode === 'mobile' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700',
            )}
            title="Mobile view"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Mobile</span>
          </button>
        </div>

        {/* Reset */}
        <button
          onClick={() => {
            if (confirm('Reset all data to seed defaults? This will discard any changes.')) {
              resetData();
            }
          }}
          className="p-2 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-700 transition"
          title="Reset to seed data"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-700 transition"
          >
            <Bell className="h-5 w-5" />
            {unread.length > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-pop border border-ink-200 animate-scale-in z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
                <h3 className="font-display font-semibold text-sm text-ink-900">Notifications</h3>
                {unread.length > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {data.notifications.slice(0, 10).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      markNotificationRead(n.id);
                      if (n.accountId) onNavigate(`/accounts/${n.accountId}`);
                      setNotifOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left border-b border-ink-50 hover:bg-ink-50 transition',
                      !n.read && 'bg-brand-50/40',
                    )}
                  >
                    <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', notifIconColor[n.type])}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{n.title}</p>
                      <p className="text-xs text-ink-500 line-clamp-2 mt-0.5">{n.message}</p>
                      <p className="text-[11px] text-ink-400 mt-1">{relativeTime(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  onNavigate('/notifications');
                  setNotifOpen(false);
                }}
                className="w-full px-4 py-3 text-sm text-brand-600 hover:bg-brand-50 font-medium transition"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export { NAV_ITEMS };
