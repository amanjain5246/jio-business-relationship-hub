import { Component, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('Unhandled error in Jio BRH:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetData = () => {
    try {
      localStorage.removeItem('jio-brh-data-v1');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-pop border border-ink-200 p-8 text-center">
          <div className="h-14 w-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="font-display text-lg font-bold text-ink-900 mb-1.5">Something went wrong</h1>
          <p className="text-sm text-ink-500 mb-6">
            The app hit an unexpected error. You can try reloading, or reset to seed data if the problem persists.
          </p>
          <div className="space-y-2">
            <button
              onClick={this.handleReload}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 active:scale-[0.99] transition"
            >
              <RefreshCw className="h-4 w-4" /> Reload
            </button>
            <button
              onClick={this.handleResetData}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-ink-200 text-ink-700 text-sm font-semibold hover:bg-ink-50 active:scale-[0.99] transition"
            >
              <RotateCcw className="h-4 w-4" /> Reset to seed data
            </button>
          </div>
        </div>
      </div>
    );
  }
}
