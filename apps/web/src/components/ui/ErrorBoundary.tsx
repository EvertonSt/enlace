import { Component, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <ErrorFallback error={this.state.error!} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/30">
      <div className="mb-4 text-4xl">💥</div>
      <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        Something went wrong
      </h2>
      <p className="mb-4 max-w-md text-sm text-gray-600 dark:text-gray-400">
        {error.message}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
      >
        Reload page
      </button>
    </div>
  );
}

/** Inline error display with retry */
export function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
      <span className="text-xl">⚠️</span>
      <div className="flex-1">
        <p className="text-sm text-red-800 dark:text-red-300">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/80"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/** Empty state display */
export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-12 text-center dark:border-gray-800 dark:bg-gray-900/30">
      <div className="mb-4 text-5xl">{icon}</div>
      <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="mb-4 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
