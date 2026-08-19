import { NAV_ITEMS } from '@/config/navigation';
import { cn } from '@/utils/cn';
import { useStore } from '@/store/StoreContext';
import { Bell } from 'lucide-react';

interface SidebarProps {
  activePath: string;
  onNavigate: (path: string) => void;
  collapsed?: boolean;
}

export function Sidebar({ activePath, onNavigate }: SidebarProps) {
  const { data } = useStore();
  const unreadCount = data.notifications.filter((n) => !n.read).length;

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-ink-200 flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-ink-100">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-display font-bold text-lg">
          J
        </div>
        <div>
          <h1 className="font-display font-bold text-ink-900 text-sm leading-tight">Jio BRH</h1>
          <p className="text-[11px] text-ink-400 leading-tight">Business Relationship Hub</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = activePath === item.path || (item.path !== '/' && activePath.startsWith(item.path));
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition group',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
              )}
            >
              <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-brand-600' : 'text-ink-400 group-hover:text-ink-600')} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === 'notifications' && unreadCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-semibold">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-ink-100">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-ink-50">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-semibold">
            AM
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-900 truncate">Arjun Mehta</p>
            <p className="text-[11px] text-ink-400 truncate">Relationship Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
