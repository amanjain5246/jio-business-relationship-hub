import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '@/store/StoreContext';
import { Bell, Search, Monitor, Smartphone, Menu, RotateCcw, Check, Building2, AlertTriangle, TrendingUp, X } from 'lucide-react';
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
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const unread = data.notifications.filter((n) => !n.read);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { accounts: [], issues: [], opportunities: [] };
    return {
      accounts: data.accounts.filter((a) => a.name.toLowerCase().includes(q) || a.industry.toLowerCase().includes(q)).slice(0, 4),
      issues: data.issues.filter((i) => i.title.toLowerCase().includes(q)).slice(0, 4),
      opportunities: data.opportunities.filter((o) => o.name.toLowerCase().includes(q)).slice(0, 4),
    };
  }, [query, data.accounts, data.issues, data.opportunities]);
  const hasResults = searchResults.accounts.length + searchResults.issues.length + searchResults.opportunities.length > 0;

  const goToAccount = (accountId: string) => {
    onNavigate(`/accounts/${accountId}`);
    setSearchOpen(false);
    setQuery('');
  };

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
      setNotifOpen(false);
    }
    if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
      setSearchOpen(false);
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
          className={cn('p-2 -ml-2 rounded-lg text-ink-600 hover:bg-ink-100 transition', viewMode !== 'mobile' && 'lg:hidden')}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative max-w-md w-full hidden sm:block" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="text"
            placeholder="Search accounts, issues, opportunities..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setSearchOpen(false); (e.target as HTMLInputElement).blur(); }
            }}
            className="w-full pl-9 pr-9 py-2 text-sm bg-ink-50 border border-transparent rounded-lg focus:bg-white focus:border-ink-200 focus:outline-none transition"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setSearchOpen(false); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {searchOpen && query.trim() && (
            <div className="absolute left-0 top-full mt-2 w-full bg-white rounded-xl shadow-pop border border-ink-200 animate-scale-in z-50 overflow-hidden max-h-96 overflow-y-auto">
              {!hasResults ? (
                <div className="px-4 py-6 text-center text-sm text-ink-400">No matches for "{query}"</div>
              ) : (
                <>
                  {searchResults.accounts.length > 0 && (
                    <div className="py-1.5">
                      <p className="px-4 py-1 text-[11px] font-semibold text-ink-400 uppercase tracking-wide">Accounts</p>
                      {searchResults.accounts.map((a) => (
                        <button key={a.id} onClick={() => goToAccount(a.id)} className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-ink-50 transition">
                          <Building2 className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                          <span className="text-sm text-ink-800 truncate">{a.name}</span>
                          <span className="text-xs text-ink-400 shrink-0">{a.industry}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.issues.length > 0 && (
                    <div className="py-1.5 border-t border-ink-100">
                      <p className="px-4 py-1 text-[11px] font-semibold text-ink-400 uppercase tracking-wide">Issues</p>
                      {searchResults.issues.map((i) => (
                        <button key={i.id} onClick={() => goToAccount(i.accountId)} className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-ink-50 transition">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span className="text-sm text-ink-800 truncate">{i.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.opportunities.length > 0 && (
                    <div className="py-1.5 border-t border-ink-100">
                      <p className="px-4 py-1 text-[11px] font-semibold text-ink-400 uppercase tracking-wide">Opportunities</p>
                      {searchResults.opportunities.map((o) => (
                        <button key={o.id} onClick={() => goToAccount(o.accountId)} className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-ink-50 transition">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="text-sm text-ink-800 truncate">{o.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
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
