import { useState, useEffect, useCallback } from 'react';
import { StoreProvider } from '@/store/StoreContext';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { Layout } from '@/components/layout/Layout';
import { DashboardPage } from '@/pages/DashboardPage';
import { AccountsPage } from '@/pages/AccountsPage';
import { AccountDetailPage } from '@/pages/AccountDetailPage';
import { Customer360Page } from '@/pages/Customer360Page';
import { InteractionsPage } from '@/pages/InteractionsPage';
import { IssuesPage } from '@/pages/IssuesPage';
import { OpportunitiesPage } from '@/pages/OpportunitiesPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { UpdateRequestsPage } from '@/pages/UpdateRequestsPage';
import { AccountabilityPage } from '@/pages/AccountabilityPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { MomPage } from '@/pages/MomPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { MobileURMPage } from '@/pages/MobileURMPage';

function parsePath(): string {
  const hash = window.location.hash.replace(/^#/, '');
  return hash || '/';
}

function App() {
  const [path, setPath] = useState<string>(parsePath);

  useEffect(() => {
    const onHashChange = () => setPath(parsePath());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((newPath: string) => {
    window.location.hash = newPath;
    setPath(newPath);
  }, []);

  // Scroll content to top on route change
  useEffect(() => {
    const main = document.querySelector('.flex-1.overflow-y-auto');
    if (main) main.scrollTop = 0;
  }, [path]);

  const renderPage = () => {
    // Account detail: /accounts/:id
    if (path.startsWith('/accounts/')) {
      const accountId = path.replace('/accounts/', '');
      return <AccountDetailPage accountId={accountId} onNavigate={navigate} />;
    }

    switch (path) {
      case '/':
        return <DashboardPage onNavigate={navigate} />;
      case '/accounts':
        return <AccountsPage onNavigate={navigate} />;
      case '/customer-360':
        return <Customer360Page onNavigate={navigate} />;
      case '/interactions':
        return <InteractionsPage />;
      case '/issues':
        return <IssuesPage />;
      case '/opportunities':
        return <OpportunitiesPage />;
      case '/notifications':
        return <NotificationsPage onNavigate={navigate} />;
      case '/update-requests':
        return <UpdateRequestsPage />;
      case '/accountability':
        return <AccountabilityPage onNavigate={navigate} />;
      case '/calendar':
        return <CalendarPage onNavigate={navigate} />;
      case '/mom':
        return <MomPage onNavigate={navigate} />;
      case '/analytics':
        return <AnalyticsPage onNavigate={navigate} />;
      case '/mobile-urm':
        return <MobileURMPage onNavigate={navigate} />;
      default:
        return <DashboardPage onNavigate={navigate} />;
    }
  };

  return (
    <StoreProvider>
      <ToastProvider>
        <Layout activePath={path} onNavigate={navigate}>
          {renderPage()}
        </Layout>
      </ToastProvider>
    </StoreProvider>
  );
}

export default App;
