import { useEffect, useState } from 'react';
import { Spinner } from './Spinner';
import { cn } from '@/lib/cn';

const DEFAULT_MIN_MS = 5000;
const DEFAULT_MAX_MS = 10000;

export function useRandomLoadDelay(minMs = DEFAULT_MIN_MS, maxMs = DEFAULT_MAX_MS) {
  const [duration] = useState(() => minMs + Math.random() * (maxMs - minMs));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), duration);
    return () => window.clearTimeout(timer);
  }, [duration]);

  return { ready, duration };
}

export function DataLoaderScreen({
  duration,
  label = 'Loading…',
  hint,
  className,
  trackClassName,
}: {
  duration: number;
  label?: string;
  hint?: string;
  className?: string;
  trackClassName?: string;
}) {
  const [progress, setProgress] = useState(false);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setProgress(true));
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      data-testid="data-loader"
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(
        'flex flex-col items-center justify-center gap-6 px-6 py-16 text-slate-500 dark:text-slate-400',
        className,
      )}
    >
      <div className="w-full max-w-sm">
        <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800', trackClassName)}>
          <div
            data-testid="data-loader-progress"
            className="h-full rounded-full bg-brand-600 transition-[width] ease-linear"
            style={{ width: progress ? '100%' : '0%', transitionDuration: `${duration}ms` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm" data-testid="data-loader-label">
        <Spinner />
        <span>{label}</span>
      </div>

      {hint && <p className="max-w-sm text-center text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
