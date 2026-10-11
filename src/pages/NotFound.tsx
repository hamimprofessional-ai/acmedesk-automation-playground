import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-3 py-24 text-center">
      <Compass className="h-10 w-10 text-slate-300 dark:text-slate-600" />
      <h1 className="text-2xl font-bold" data-testid="page-title">
        404 — Page not found
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        The page you are looking for does not exist or has moved.
      </p>
      <Link to="/" className="btn-primary mt-2">
        Back to dashboard
      </Link>
    </div>
  );
}
