import { Inbox, AlertTriangle } from 'lucide-react';
import { Spinner } from './Spinner';

export function EmptyState({ title = 'Nothing here', message }: { title?: string; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center" data-testid="empty-state">
      <Inbox className="h-8 w-8 text-slate-300 dark:text-slate-600" />
      <p className="font-medium text-slate-600 dark:text-slate-300">{title}</p>
      {message && <p className="text-sm text-slate-400">{message}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center" data-testid="error-state">
      <AlertTriangle className="h-8 w-8 text-rose-400" />
      <p className="font-medium text-slate-700 dark:text-slate-200">{message}</p>
      {onRetry && (
        <button type="button" className="btn-secondary" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-slate-500" data-testid="loading">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}
