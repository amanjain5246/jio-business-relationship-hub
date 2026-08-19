import {
  LayoutDashboard,
  Building2,
  Users,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Bell,
  FileEdit,
  ShieldCheck,
  Calendar,
  FileText,
  BarChart3,
  Smartphone,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'accounts', label: 'Accounts', icon: Building2, path: '/accounts' },
  { id: 'customer360', label: 'Customer 360', icon: Users, path: '/customer-360' },
  { id: 'interactions', label: 'Interactions', icon: MessageSquare, path: '/interactions' },
  { id: 'issues', label: 'Issues', icon: AlertTriangle, path: '/issues' },
  { id: 'opportunities', label: 'Opportunities', icon: TrendingUp, path: '/opportunities' },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications' },
  { id: 'update-requests', label: 'Update Requests', icon: FileEdit, path: '/update-requests' },
  { id: 'accountability', label: 'Accountability', icon: ShieldCheck, path: '/accountability' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar' },
  { id: 'mom', label: 'MOM Summaries', icon: FileText, path: '/mom' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { id: 'mobile-urm', label: 'Mobile URM', icon: Smartphone, path: '/mobile-urm' },
];
